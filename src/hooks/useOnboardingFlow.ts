import { logger } from '@/src/utils/logger';
import { translateGlobalGoal } from '@/src/i18n';
import { getGlobalGoals } from '@/src/services/goal.service';
import { getActiveModules } from '@/src/services/module.service';
import {
  acceptTerms,
  getModules,
  getOnboardingStatus,
  setBasicInfo,
  setSelectedModules,
} from '@/src/services/onboarding.service';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import { useOnboardingStorage } from '@/src/hooks/use-onboarding-storage';
import { Goal } from '@/src/types/goal';
import { BasicInfoPayload, Module } from '@/src/types/user';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

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

/**
 * Máquina de estados del onboarding: resuelve la fase actual contra el backend,
 * restaura/guarda el draft local, carga objetivos y módulos, y orquesta el envío
 * de cada fase (términos → datos básicos → selección de módulos → configuración).
 * La pantalla `app/onboarding.tsx` solo consume estos valores para renderizar el
 * paso correcto.
 */
export function useOnboardingFlow() {
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
    clearOnboardingCompleted,
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
        // Limpiar flags locales al iniciar — el backend es la única fuente de verdad
        await AsyncStorage.multiRemove(['@onboarding_completed', '@onboarding_module_config_step']);

        const token = await getToken();

        // 1. Consultar estado del backend (fuente de verdad)
        const responseData: any = await getOnboardingStatus(token);

        // Manejar tanto si es { status: "..." } como si es { onboardingStatus: "..." } o solo string
        const statusValue = typeof responseData === 'string'
          ? responseData
          : (responseData?.status || responseData?.onboardingStatus || responseData?.onboarding_status || '');

        const status = typeof statusValue === 'string' ? statusValue.toUpperCase().trim() : '';

        if (status === 'COMPLETED') {
          await setOnboardingCompleted();
          router.replace('/(tabs)');
          return;
        }

        // El backend confirma que NO está completo: limpiar flag local corrupto si existiera
        await clearOnboardingCompleted();

        if (status === 'AWAITING_TERMS_ACCEPTANCE' || status === 'AWAITNG_TERMS_ACCEPTANCE') {
          setStep(-2);
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
          let savedModules = await loadSelectedModules();

          // Fallback: si el storage local no los tiene (reinstall, cache limpia,
          // otro dispositivo), el backend es la fuente de verdad.
          if (!savedModules || savedModules.length === 0) {
            try {
              const [activeNames, allModules] = await Promise.all([
                getActiveModules(token),
                getModules(token),
              ]);
              const activeNameSet = new Set(activeNames.map((m) => m.name));
              const reconstructed = allModules.filter((m) => activeNameSet.has(m.name));

              if (reconstructed.length > 0) {
                savedModules = reconstructed;
                await saveSelectedModules(reconstructed);
              }
            } catch (err) {
              logger.error('Error reconstruyendo módulos activos desde backend:', err);
            }
          }

          if (savedModules && savedModules.length > 0) {
            setActiveModules(sortModules(savedModules));
          } else {
            // No se pudo determinar los módulos activos: volver a selección
            setStep(3);
            return;
          }

          // Restaurar el índice de configuración (validar que no esté fuera de rango)
          const savedStep = await loadConfigStep();
          if (savedStep !== null && savedStep < savedModules.length) {
            setConfigIndex(savedStep);
          } else {
            setConfigIndex(0);
            await saveConfigStep(0);
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
        logger.error('Error obteniendo estado de onboarding:', e);
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
          logger.error('Error cargando objetivos:', e);
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
          logger.error('Error cargando módulos:', e);
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
   * Acepta los términos de privacidad y avanza a datos básicos.
   */
  const handleAcceptTerms = async () => {
    setIsTransitioning(true);
    try {
      const token = await getToken();
      const success = await acceptTerms(token);
      if (success) {
        setStep(0);
      } else {
        alert('Hubo un problema al aceptar los términos.');
      }
    } catch (error) {
      logger.error('Error al aceptar términos:', error);
      alert('Ocurrió un error inesperado al aceptar los términos.');
    } finally {
      setIsTransitioning(false);
    }
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
      logger.error('Error guardando datos básicos:', error);
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
      logger.error('Error guardando módulos:', error);
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
      if (found) return translateGlobalGoal(found.name);
    }
    return translateGlobalGoal(draftedGoalName || '');
  }, [goal, globalGoals, draftedGoalName]);

  return {
    step,
    setStep,
    isSubmitting,
    setIsSubmitting,
    isTransitioning,
    // datos básicos
    date,
    setDate,
    gender,
    setGender,
    weight,
    setWeight,
    height,
    setHeight,
    goal,
    setGoal,
    globalGoals,
    isLoadingGoals,
    // módulos
    modules,
    selectedModuleIds,
    setSelectedModuleIds,
    isLoadingModules,
    // configuración
    activeModules,
    configIndex,
    globalGoalName,
    // handlers
    advanceStep,
    handleAcceptTerms,
    handleBasicInfoSubmit,
    handleModulesSubmit,
    handleModuleConfigured,
  };
}
