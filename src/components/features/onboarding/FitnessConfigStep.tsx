import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import CheckableCard from '@/src/components/common/CheckableCard';
import EquipmentSelect from '@/src/components/common/EquipmentSelect';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import RulerPicker from '@/src/components/common/RulerPicker';
import SectionCard from '@/src/components/common/SectionCard';
import SelectableCard from '@/src/components/common/SelectableCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import WeekDayPicker from '@/src/components/common/WeekDayPicker';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
  getEquipments,
  getSubGoals,
  submitFitnessProfile,
} from '@/src/services/fitness.service';
import {
  Equipment,
  EquipmentSelection,
  EXPERIENCE_LEVEL_OPTIONS,
  SubGoal,
  TRAINING_HISTORY_OPTIONS,
  WEEKDAY_OPTIONS,
} from '@/src/types/fitness';

interface FitnessConfigStepProps {
  /** Color de marca del módulo Fitness (para el botón Continuar) */
  brandColor: string;
  /** ID del módulo actual (para obtener los sub-objetivos) */
  moduleId: string;
  /** Nombre de la meta global elegida */
  globalGoalName: string;
  /** Callback al finalizar toda la configuración de Fitness */
  onComplete: () => void;
  /** Indica si se está enviando al backend */
  isSubmitting: boolean;
  /** Setter para controlar el estado de envío desde el padre */
  setIsSubmitting: (v: boolean) => void;
}

/**
 * Configuración del módulo Fitness durante el onboarding.
 * Se compone de 3 pantallas internas:
 *   - SubStep 0: Nivel de experiencia + Nivel de actividad
 *   - SubStep 1: Disponibilidad (días) + Duración de sesión
 *   - SubStep 2: Entorno (Home/Gym) + Equipamiento → envía POST
 */
export default function FitnessConfigStep({
  brandColor,
  moduleId,
  globalGoalName,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: FitnessConfigStepProps) {
  const { getToken } = useAuth();
  const { saveFitnessConfig, loadFitnessConfig } = useModuleConfigStorage();

  // Sub-paso interno
  const [subStep, setSubStep] = useState(0);

  // ── Estado pantalla 0 ──
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [trainingHistory, setTrainingHistory] = useState<string>('');

  // ── Estado pantalla 1 ──
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [selectedSubGoalIds, setSelectedSubGoalIds] = useState<string[]>([]);
  const [isLoadingSubGoals, setIsLoadingSubGoals] = useState(false);

  // ── Estado pantalla 2 ──
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [hasFlexibleTime, setHasFlexibleTime] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(60);

  // ── Estado pantalla 3 ──
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSelection[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);

  /**
   * Carga inicial: restaurar draft local.
   */
  useEffect(() => {
    const restoreDraft = async () => {
      const draft = await loadFitnessConfig();
      if (draft) {
        if (draft.experienceLevel) setExperienceLevel(draft.experienceLevel);
        if (draft.trainingHistory) setTrainingHistory(draft.trainingHistory);
        if (draft.selectedSubGoalIds) setSelectedSubGoalIds(draft.selectedSubGoalIds);
        if (draft.preferredWorkoutDays)
          setSelectedDays(draft.preferredWorkoutDays);
        if (draft.hasFlexibleTime !== undefined)
          setHasFlexibleTime(draft.hasFlexibleTime);
        if (draft.sessionDurationPreference)
          setSessionDuration(draft.sessionDurationPreference);
        if (draft.availableEquipment)
          setSelectedEquipment(Array.isArray(draft.availableEquipment) ? draft.availableEquipment : []);
      }
    };
    restoreDraft();
  }, []);

  /**
   * Carga sub-objetivos cuando se llega a la pantalla 1.
   */
  useEffect(() => {
    if (subStep === 1 && subGoals.length === 0) {
      const fetchSubGoals = async () => {
        setIsLoadingSubGoals(true);
        try {
          const token = await getToken();
          const data = await getSubGoals(moduleId, token);
          setSubGoals(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error('Error cargando sub-objetivos:', e);
          alert('No se pudieron cargar los sub-objetivos.');
        } finally {
          setIsLoadingSubGoals(false);
        }
      };
      fetchSubGoals();
    }
  }, [subStep]);

  /**
   * Carga equipamiento cuando se llega a la pantalla 3.
   */
  useEffect(() => {
    if (subStep === 3 && equipmentList.length === 0) {
      const fetchEquipments = async () => {
        setIsLoadingEquipment(true);
        try {
          const token = await getToken();
          const data = await getEquipments(token);
          setEquipmentList(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error('Error cargando equipamiento:', e);
          alert('No se pudo cargar el equipamiento.');
        } finally {
          setIsLoadingEquipment(false);
        }
      };
      fetchEquipments();
    }
  }, [subStep]);

  /**
   * Auto-guarda el draft en local al cambiar cualquier valor.
   */
  useEffect(() => {
    saveFitnessConfig({
      experienceLevel,
      trainingHistory,
      selectedSubGoalIds,
      preferredWorkoutDays: selectedDays,
      hasFlexibleTime,
      sessionDurationPreference: hasFlexibleTime ? 0 : sessionDuration,
      availableEquipment: selectedEquipment,
    });
  }, [
    experienceLevel,
    trainingHistory,
    selectedSubGoalIds,
    selectedDays,
    hasFlexibleTime,
    sessionDuration,
    selectedEquipment,
  ]);

  // ── Handlers de navegación ──

  const handleContinueStep0 = () => {
    if (!experienceLevel) {
      alert('Por favor selecciona tu nivel de experiencia.');
      return;
    }
    if (!trainingHistory) {
      alert('Por favor selecciona tu nivel de actividad.');
      return;
    }
    setSubStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();

      await submitFitnessProfile(
        {
          experienceLevel: String(experienceLevel),
          trainingHistory: String(trainingHistory),
          preferredWorkoutDays: selectedDays,
          availableEquipment: selectedEquipment.map((e) => ({
            id: String(e.id),
            qty: Number(e.qty),
          })),
          sessionDurationPreference: hasFlexibleTime ? 0 : sessionDuration,
          subGoals: selectedSubGoalIds,
        },
        token
      );

      onComplete();
    } catch (error) {
      console.error('Error enviando perfil de fitness:', error);
      alert('Hubo un error al guardar los datos de entrenamiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers de selección ──

  const toggleSubGoal = (id: string) => {
    setSelectedSubGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const incrementEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e))
    );
  };

  const decrementEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      const item = prev.find((e) => e.id === id);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((e) => e.id !== id);
      return prev.map((e) => (e.id === id ? { ...e, qty: e.qty - 1 } : e));
    });
  };

  const removeEquipment = (id: string) => {
    setSelectedEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  const selectedWithDetails = selectedEquipment.map((sel) => ({
    ...sel,
    name: equipmentList.find((eq) => eq.id === sel.id)?.name ?? '',
  }));

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 1: Experiencia + Actividad
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 0) {
    return (
      <View className="flex-1">
        <ProgressBar currentStep={subStep} totalSteps={4} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title={"Perfil de\nentrenamiento"}
            subtitle="Conocer tu experiencia nos ayudará a ajustar la intensidad de tus entrenamientos."
          />

          {/* Card: Nivel de experiencia */}
          <SectionCard
            icon={<Ionicons name="bar-chart" size={20} color="#64748b" />}
            title="Nivel de experiencia"
            subtitle="¿Cuál es tu punto de partida?"
            className="mb-4"
          >
            <View className="flex-row flex-wrap gap-3">
              {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  isSelected={experienceLevel === option.value}
                  brandColor={brandColor}
                  label={option.label}
                  onPress={() => setExperienceLevel(option.value)}
                  size="half"
                />
              ))}
            </View>
          </SectionCard>

          {/* Card: Nivel de actividad (trainingHistory) */}
          <SectionCard
            icon={<Ionicons name="timer-outline" size={20} color="#64748b" />}
            title="Nivel de actividad"
            subtitle="¿Hace cuánto entrenas?"
          >
            <View className="flex-row flex-wrap gap-3">
              {TRAINING_HISTORY_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  isSelected={trainingHistory === option.value}
                  brandColor={brandColor}
                  label={option.label}
                  onPress={() => setTrainingHistory(option.value)}
                  size="half"
                  textSize="sm"
                />
              ))}
            </View>
          </SectionCard>
        </ScrollView>

        <OnboardingFooter
          onPress={handleContinueStep0}
          helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
          helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
        />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 2: Sub-objetivos
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 1) {
    return (
      <SwipeBackWrapper onSwipeBack={() => setSubStep(0)}>
        <View className="flex-1">
          <ProgressBar currentStep={subStep} totalSteps={4} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Define tu enfoque principal para personalizar tus rutinas y progresión."
            />

            <SectionCard
              icon={<Ionicons name="ribbon-outline" size={20} color="#64748b" />}
              title="Sub objetivo"
              subtitle="¿Qué quieres lograr?"
            >
              {isLoadingSubGoals ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="large" color={brandColor} />
                  <Text className="text-slate-500 dark:text-slate-400 mt-4">
                    Cargando objetivos...
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {subGoals.map((goal) => (
                    <CheckableCard
                      key={goal.id}
                      isSelected={selectedSubGoalIds.includes(goal.id)}
                      label={goal.name}
                      description={goal.description}
                      onPress={() => toggleSubGoal(goal.id)}
                    />
                  ))}
                </View>
              )}
            </SectionCard>
          </ScrollView>

          <OnboardingFooter
            onPress={() => setSubStep(2)}
            helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
            helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
          />
        </View>
      </SwipeBackWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 3: Disponibilidad + Duración de sesión
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 2) {
    return (
      <SwipeBackWrapper onSwipeBack={() => setSubStep(1)}>
        <View className="flex-1">
          <ProgressBar currentStep={subStep} totalSteps={4} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Adaptaremos tus entrenamientos a tu rutina y tiempo disponible."
            />

            {/* Card: Disponibilidad */}
            <SectionCard
              icon={<Ionicons name="calendar-outline" size={20} color="#64748b" />}
              title="Disponibilidad"
              subtitle="¿Qué días tenés disponibles?"
              className="mb-4"
            >
              <WeekDayPicker
                days={WEEKDAY_OPTIONS}
                selectedDays={selectedDays}
                onChange={setSelectedDays}
              />
            </SectionCard>

            {/* Card: Duración de sesión */}
            <SectionCard
              icon={<Ionicons name="time-outline" size={20} color="#64748b" />}
              title="Duración"
              subtitle="¿De cuánto tiempo dispónes?"
            >
              <View className="flex-row gap-3 mb-2">
                <View className="flex-1">
                  <SelectableCard
                    isSelected={hasFlexibleTime}
                    brandColor={brandColor}
                    label="Tengo tiempo"
                    onPress={() => setHasFlexibleTime(true)}
                    textSize="sm"
                    size="auto"
                  />
                </View>
                <View className="flex-1">
                  <SelectableCard
                    isSelected={!hasFlexibleTime}
                    brandColor={brandColor}
                    label="Elegir tiempo"
                    onPress={() => setHasFlexibleTime(false)}
                    textSize="sm"
                    size="auto"
                  />
                </View>
              </View>

              {/* RulerPicker — solo si "Elegir tiempo" */}
              {!hasFlexibleTime && (
                <RulerPicker
                  label="Tiempo"
                  min={15}
                  max={120}
                  initial={sessionDuration}
                  step={5}
                  unit="min"
                  onValueChange={setSessionDuration}
                />
              )}
            </SectionCard>
          </ScrollView>

          <OnboardingFooter
            onPress={() => setSubStep(3)}
            helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
            helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
          />
        </View>
      </SwipeBackWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 4: Entorno + Equipamiento → POST
  // ═══════════════════════════════════════════════════════════════════
  return (
    <SwipeBackWrapper onSwipeBack={() => setSubStep(2)}>
      <View className="flex-1">
        <ProgressBar currentStep={3} totalSteps={4} />

        <Pressable
          style={{ flex: 1 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Conocer tu equipamiento nos ayudará a crear entrenamientos más precisos."
            />

            {/* Card: Equipamiento - buscador */}
            <SectionCard
              icon={<Ionicons name="barbell-outline" size={20} color="#64748b" />}
              title="Equipamiento"
              subtitle="¿Con qué materiales cuentas?"
              className="mb-4"
            >
              {isLoadingEquipment ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="large" color={brandColor} />
                  <Text className="text-slate-500 dark:text-slate-400 mt-4">
                    Cargando equipamiento...
                  </Text>
                </View>
              ) : (
                <EquipmentSelect
                  equipments={equipmentList}
                  selectedEquipment={selectedEquipment}
                  onSelectionChange={setSelectedEquipment}
                  placeholder="Buscar equipamiento"
                  showSelectedList={false}
                />
              )}
            </SectionCard>

            {/* Lista de equipamiento seleccionado */}
            {selectedWithDetails.length > 0 && (
              <View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Seleccionadas ({selectedEquipment.length})
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedEquipment([])}>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      Borrar todas
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedWithDetails.map((item) => (
                  <View
                    key={String(item.id)}
                    className="flex-row items-center px-4 py-3 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"
                  >
                    <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      {/* Pill - qty + */}
                      <View className="flex-row items-center border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 gap-3">
                        <TouchableOpacity
                          onPress={() => decrementEquipment(String(item.id))}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
                            -
                          </Text>
                        </TouchableOpacity>
                        <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50 min-w-[16px] text-center">
                          {item.qty}
                        </Text>
                        <TouchableOpacity
                          onPress={() => incrementEquipment(String(item.id))}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeEquipment(String(item.id))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>

        <OnboardingFooter
          onPress={handleSubmit}
          disabled={isSubmitting}
          helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
          helperIcon={<Ionicons name="sparkles-outline" size={18} color="#64748b" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}
