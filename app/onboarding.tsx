import {
  getModules,
  getOnboardingStatus,
  setBasicInfo,
  setSelectedModules,
} from '@/src/services/onboarding.service';
import { getGlobalGoals } from '@/src/services/goal.service';
import { Goal } from '@/src/types/goal';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { View } from 'react-native';

import { FullPageLoader } from '@/src/components/common/FullPageLoader';
import BasicInfoStep1 from '@/src/components/features/onboarding/BasicInfoStep1';
import BasicInfoStep2 from '@/src/components/features/onboarding/BasicInfoStep2';
import BasicInfoStep3 from '@/src/components/features/onboarding/BasicInfoStep3';
import ModuleSelectionStep from '@/src/components/features/onboarding/ModuleSelectionStep';
import ModuleConfigRouter from '@/src/components/features/onboarding/ModuleConfigRouter';
import { useOnboardingStorage } from '@/src/hooks/use-onboarding-storage';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import { BasicInfoPayload, Module } from '@/src/types/user';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';

/** Orden fijo de configuración de módulos */
const MODULE_ORDER = ['Health', 'Fitness', 'Nutrition'];

/** Ordena módulos según el orden establecido */
function sortModules(modules: Module[]): Module[] {
  return [...modules].sort((a, b) => {
    const indexA = MODULE_ORDER.indexOf(a.name);
    const indexB = MODULE_ORDER.indexOf(b.name);
    // Módulos no listados van al final
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}


export default function OnboardingScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { saveDraft, loadDraft, clearDraft } = useOnboardingStorage();
  const {
    saveSelectedModules,
    loadSelectedModules,
    clearAllModuleConfig,
    saveConfigStep,
    loadConfigStep,
    setOnboardingCompleted,
  } = useModuleConfigStorage();

  // Estado general
  const [step, setStep] = useState(-1); // -1 = inicializando
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Datos básicos (pasos 0-2)
  const [date, setDate] = useState(new Date(2004, 0, 1));
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(168);
  const [goal, setGoal] = useState('');
  const [draftedGoalName, setDraftedGoalName] = useState('');
  const [globalGoals, setGlobalGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  // Módulos (paso 3)
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  // Configuración de módulos (paso 4)
  const [activeModules, setActiveModules] = useState<Module[]>([]);
  const [configIndex, setConfigIndex] = useState(0);

  /**
   * Inicialización: consulta el estado del backend para saber en qué fase
   * del onboarding se encuentra el usuario, luego carga el draft local
   * si estamos en la fase de datos básicos.
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();

        // 1. Consultar estado del backend (fuente de verdad)
        const { status } = await getOnboardingStatus(token);

        if (status === 'COMPLETED') {
          await setOnboardingCompleted();
          router.replace('/(tabs)');
          return;
        }

        // Si el backend dice que ya pasó la fase de datos básicos → módulos
        if (status === 'AWAITING_MODULE_SELECTION') {
          // Intentar cargar draft local para reanudar el objetivo seleccionado
          const draft = await loadDraft();
          if (draft?.GlobalGoal) setGoal(draft.GlobalGoal);
          if (draft?.GlobalGoalName) setDraftedGoalName(draft.GlobalGoalName);
          
          setStep(3);
          return;
        }

        // Si ya seleccionó módulos pero falta configuración
        if (status === 'AWAITING_MODULE_CONFIG') {
          // Restaurar los módulos activos desde local
          const savedModules = await loadSelectedModules();
          if (savedModules && savedModules.length > 0) {
            setActiveModules(sortModules(savedModules));
          }
          // Restaurar el índice de configuración
          const savedStep = await loadConfigStep();
          if (savedStep !== null) {
            setConfigIndex(savedStep);
          }
          // Restaurar el objetivo global seleccionado (para Nutrition)
          const draft = await loadDraft();
          if (draft?.GlobalGoal) {
            setGoal(draft.GlobalGoal);
          }
          if (draft?.GlobalGoalName) {
            setDraftedGoalName(draft.GlobalGoalName);
          }
          // Cargar goals para tener el nombre disponible
          try {
            const goalsData = await getGlobalGoals(token);
            setGlobalGoals(goalsData);
          } catch {}
          setStep(4);
          return;
        }
      } catch (e) {
        console.error('Error obteniendo estado de onboarding:', e);
        // Si falla, asumimos que empieza desde el principio
      }

      // 2. Estamos en la fase de datos básicos (AWAITING_BASIC_DATA).
      //    Intentar cargar draft local para reanudar el sub-paso.
      const draft = await loadDraft();
      if (draft) {
        if (draft.birthDay) setDate(new Date(draft.birthDay));
        if (draft.gender) setGender(draft.gender);
        if (draft.heightCm) setHeight(draft.heightCm);
        if (draft.weightKg) setWeight(draft.weightKg);
        if (draft.GlobalGoal) setGoal(draft.GlobalGoal);
        if (draft.GlobalGoalName) setDraftedGoalName(draft.GlobalGoalName);
        if (draft.currentStep !== undefined) {
          setStep(draft.currentStep);
          return;
        }
      }

      // Por defecto, empezamos en el paso 0
      setStep(0);
    };

    initialize();
  }, []);

  /**
   * Carga los objetivos globales cuando se llega al paso 2.
   */
  useEffect(() => {
    if (step === 2) {
      const fetchGoals = async () => {
        setIsLoadingGoals(true);
        try {
          const token = await getToken();
          const data = await getGlobalGoals(token);
          setGlobalGoals(data);
        } catch (e) {
          console.error('Error cargando objetivos:', e);
          alert('No se pudieron cargar los objetivos.');
        } finally {
          setIsLoadingGoals(false);
        }
      };
      fetchGoals();
    }
  }, [step]);

  /**
   * Carga los módulos del backend cuando se llega al paso 3.
   */
  useEffect(() => {
    if (step === 3) {
      const fetchModules = async () => {
        setIsLoadingModules(true);
        try {
          const token = await getToken();
          const data = await getModules(token);
          setModules(data);
        } catch (e) {
          console.error('Error cargando módulos:', e);
          alert('No se pudieron cargar los módulos.');
        } finally {
          setIsLoadingModules(false);
        }
      };
      fetchModules();
    }
  }, [step]);

  /**
   * Guarda el draft actual en AsyncStorage y avanza al siguiente paso.
   */
  const advanceStep = async (nextStep: number) => {
    // Si estamos en el paso de objetivos (paso 2), buscar el nombre para el draft
    let currentGoalName = draftedGoalName;
    if (step === 2 && goal) {
      const g = globalGoals.find(x => x.id === goal);
      if (g) currentGoalName = g.name;
    }

    await saveDraft({
      birthDay: date.toISOString().split('T')[0],
      gender,
      heightCm: height,
      weightKg: weight,
      GlobalGoal: goal,
      GlobalGoalName: currentGoalName,
      currentStep: nextStep,
    });
    if (currentGoalName) setDraftedGoalName(currentGoalName);
    setStep(nextStep);
  };

  /**
   * Envía los datos básicos al backend y avanza al paso de módulos.
   * Usa FullPageLoader durante la transición y pre-carga los módulos.
   */
  const handleBasicInfoSubmit = async () => {
    if (!user) {
      alert('Error: Usuario no encontrado.');
      return;
    }

    setIsTransitioning(true);
    try {
      const token = await getToken();

      const payload: BasicInfoPayload = {
        birthDay: date.toISOString().split('T')[0],
        gender,
        heightCm: height,
        weightKg: weight,
        GlobalGoal: goal,
      };

      // Enviar datos básicos + pre-cargar módulos en paralelo
      const [, modulesData] = await Promise.all([
        setBasicInfo(payload, token),
        getModules(token),
      ]);

      // Guardar el draft final de info básica para asegurar que el goal persiste
      let currentGoalName = draftedGoalName;
      const g = globalGoals.find(x => x.id === goal);
      if (g) currentGoalName = g.name;

      await saveDraft({
        birthDay: date.toISOString().split('T')[0],
        gender,
        heightCm: height,
        weightKg: weight,
        GlobalGoal: goal,
        GlobalGoalName: currentGoalName,
        currentStep: 3,
      });
      if (currentGoalName) setDraftedGoalName(currentGoalName);

      // Los módulos ya están cargados — setear directamente
      setModules(modulesData);

      setStep(3);
    } catch (error) {
      console.error('Error guardando datos básicos:', error);
      alert('Hubo un error al guardar los datos.');
    } finally {
      setIsTransitioning(false);
    }
  };

  /**
   * Envía los módulos seleccionados al backend.
   * Usa FullPageLoader durante la transición.
   */
  const handleModulesSubmit = async () => {
    if (!user) {
      alert('Error: Usuario no encontrado.');
      return;
    }

    setIsTransitioning(true);
    try {
      const token = await getToken();
      await setSelectedModules(selectedModuleIds, token);

      // Guardar los módulos activos completos en local (ordenados)
      const selected = sortModules(modules.filter((m) => selectedModuleIds.includes(m.id)));
      await saveSelectedModules(selected);
      setActiveModules(selected);
      setConfigIndex(0);
      await saveConfigStep(0);

      setStep(4);
    } catch (error) {
      console.error('Error guardando módulos:', error);
      alert('Hubo un error al guardar los módulos.');
    } finally {
      setIsTransitioning(false);
    }
  };

  /**
   * Callback cuando un módulo termina su configuración.
   * Avanza al siguiente módulo o finaliza el onboarding.
   * Usa el flag local para evitar depender de la sincronización de Clerk.
   */
  const handleModuleConfigured = async () => {
    const nextIndex = configIndex + 1;

    if (nextIndex >= activeModules.length) {
      // Todos los módulos fueron configurados → limpiar y redirigir
      setIsTransitioning(true);
      await clearAllModuleConfig();
      await clearDraft();
      await setOnboardingCompleted();
      setIsTransitioning(false);
      router.replace('/(tabs)');
    } else {
      // Avanzar al siguiente módulo y persistir
      setConfigIndex(nextIndex);
      await saveConfigStep(nextIndex);
    }
  };

  /**
   * Nombre del objetivo global seleccionado.
   */
  const globalGoalName = useMemo(() => {
    if (globalGoals.length > 0 && goal) {
      const found = globalGoals.find((g) => g.id === goal);
      if (found) return found.name;
    }
    return draftedGoalName || '';
  }, [goal, globalGoals, draftedGoalName]);

  // Mientras inicializamos o estamos en transición, mostramos el loader
  if (step === -1 || isTransitioning) {
    return (
      <FullPageLoader message={isTransitioning ? 'Guardando tu progreso...' : 'Cargando tu progreso...'} />
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-zinc-900">
      {step === 0 && (
        <BasicInfoStep1
          date={date}
          onDateChange={setDate}
          gender={gender}
          onGenderChange={setGender}
          onContinue={() => advanceStep(1)}
        />
      )}

      {step === 1 && (
        <SwipeBackWrapper onSwipeBack={() => setStep(0)}>
        <BasicInfoStep2
          weight={weight}
          onWeightChange={setWeight}
          height={height}
          onHeightChange={setHeight}
          onContinue={() => advanceStep(2)}
          onBack={() => setStep(0)}
        />
        </SwipeBackWrapper>
      )}

      {step === 2 && (
        <SwipeBackWrapper onSwipeBack={() => setStep(1)}>
        <BasicInfoStep3
          goal={goal}
          onGoalChange={setGoal}
          onContinue={handleBasicInfoSubmit}
          onBack={() => setStep(1)}
          isSubmitting={isSubmitting}
          goals={globalGoals}
          isLoading={isLoadingGoals}
        />
        </SwipeBackWrapper>
      )}

      {step === 3 && (
        <ModuleSelectionStep
          modules={modules}
          selectedModuleIds={selectedModuleIds}
          onSelectionChange={setSelectedModuleIds}
          onContinue={handleModulesSubmit}
          isSubmitting={isSubmitting}
          isLoading={isLoadingModules}
        />
      )}

      {step === 4 && (
        <ModuleConfigRouter
          activeModules={activeModules}
          currentConfigIndex={configIndex}
          onModuleConfigured={handleModuleConfigured}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          globalGoalName={globalGoalName}
        />
      )}
    </SafeAreaView>
  );
}
