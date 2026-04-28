import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BackButton from '@/src/components/common/BackButton';
import EquipmentSelect from '@/src/components/common/EquipmentSelect';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import RulerPicker from '@/src/components/common/RulerPicker';
import SelectableCard from '@/src/components/common/SelectableCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
  Equipment,
  EquipmentSelection,
  EXPERIENCE_LEVEL_OPTIONS,
  TRAINING_HISTORY_OPTIONS,
  WEEKDAY_OPTIONS,
  WORKOUT_LOCATION_OPTIONS,
  SubGoal,
} from '@/src/types/fitness';
import {
  getEquipments,
  getSubGoals,
  submitFitnessProfile,
} from '@/src/services/fitness.service';

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
  const [workoutLocation, setWorkoutLocation] = useState<string>('');
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
        if (draft.workoutLocation) setWorkoutLocation(draft.workoutLocation);
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
      workoutLocation,
      availableEquipment: selectedEquipment,
    });
  }, [
    experienceLevel,
    trainingHistory,
    selectedSubGoalIds,
    selectedDays,
    hasFlexibleTime,
    sessionDuration,
    workoutLocation,
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
          workoutLocation: String(workoutLocation),
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

  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const toggleSubGoal = (id: string) => {
    setSelectedSubGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 1: Experiencia + Actividad
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 0) {
    return (
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title="Perfil de entrenamiento"
            subtitle="Ajustemos los detalles para tu rutina ideal"
          />

          {/* Nivel de experiencia */}
          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Nivel de experiencia
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿Cuál es tu punto de partida?
          </Text>

          <View className="flex-row flex-wrap gap-3 mb-8">
            {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                isSelected={experienceLevel === option.value}
                brandColor={brandColor}
                label={option.label}
                onPress={() => setExperienceLevel(option.value)}
                size="auto"
              />
            ))}
          </View>

          {/* Nivel de actividad (trainingHistory) */}
          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Nivel de actividad
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            Define tu punto de partida
          </Text>

          <View className="flex-row flex-wrap justify-between">
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
        </ScrollView>

        <OnboardingFooter
          brandColor={brandColor}
          onPress={handleContinueStep0}
          helperText="Puedes editar estos datos luego."
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
          <BackButton onPress={() => setSubStep(0)} color={brandColor} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title="Perfil de entrenamiento"
              subtitle="Ajustemos los detalles para tu rutina ideal"
            />

            <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
              Tu objetivo
            </Text>
            <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              ¿Qué quieres lograr?
            </Text>

            {isLoadingSubGoals ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color={brandColor} />
                <Text className="text-slate-500 dark:text-zinc-400 mt-4">
                  Cargando objetivos...
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {subGoals.map((goal) => (
                  <SelectableCard
                    key={goal.id}
                    isSelected={selectedSubGoalIds.includes(goal.id)}
                    brandColor={brandColor}
                    label={goal.name}
                    description={goal.description}
                    onPress={() => toggleSubGoal(goal.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <OnboardingFooter
            brandColor={brandColor}
            onPress={() => setSubStep(2)}
            helperText={`Estos sub-objetivos están adaptados a tu meta principal: ${globalGoalName}\nPuedes editar estos datos luego.`}
          />
        </View>
      </SwipeBackWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 3: Disponibilidad + Duración de sesión
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 2) {
    const weekendSelectedColor = '#f87171'; // red-400

    return (
      <SwipeBackWrapper onSwipeBack={() => setSubStep(1)}>
      <View className="flex-1">
        <BackButton onPress={() => setSubStep(1)} color={brandColor} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title="Perfil de entrenamiento"
            subtitle="Ajustemos los detalles para tu rutina ideal"
          />

          {/* Disponibilidad */}
          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Disponibilidad
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿Cuántos días entrenarás?
          </Text>

          <View className="flex-row justify-between mb-8">
            {WEEKDAY_OPTIONS.map((day) => {
              const isSelected = selectedDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  activeOpacity={0.7}
                  className={`w-11 h-11 rounded-xl items-center justify-center border-2 ${
                    isSelected ? '' : 'border-gray-200 dark:border-zinc-700'
                  }`}
                  style={[
                    isSelected && {
                      backgroundColor: day.isWeekend ? weekendSelectedColor : brandColor,
                      borderColor: day.isWeekend ? weekendSelectedColor : brandColor,
                    },
                  ]}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isSelected ? 'text-white' : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duración de sesión */}
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿De cuánto tiempo dispones por sesión?
          </Text>

          <View className="flex-row gap-3 mb-6">
            <SelectableCard
              isSelected={hasFlexibleTime}
              brandColor={brandColor}
              label="Tengo tiempo"
              onPress={() => setHasFlexibleTime(true)}
              textSize="sm"
            />
            <SelectableCard
              isSelected={!hasFlexibleTime}
              brandColor={brandColor}
              label="Elegir tiempo"
              onPress={() => setHasFlexibleTime(false)}
              textSize="sm"
            />
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
        </ScrollView>

        <OnboardingFooter
          brandColor={brandColor}
          onPress={() => setSubStep(3)}
          helperText="Puedes editar estos datos luego."
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
      <BackButton onPress={() => setSubStep(2)} color={brandColor} />

      <View className="flex-1 px-8">
        <Pressable
          style={{ flex: 1, paddingTop: 16 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <OnboardingHeader
            title="Perfil de entrenamiento"
            subtitle="Ajustemos los detalles para tu rutina ideal"
          />

          {/* Entorno */}
          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Entorno
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿Dónde entrenarás hoy?
          </Text>

          <View className="flex-row gap-3 mb-8">
            {WORKOUT_LOCATION_OPTIONS.map((option) => (
              <SelectableCard
                key={option.value}
                isSelected={workoutLocation === option.value}
                brandColor={brandColor}
                label={option.label}
                onPress={() => setWorkoutLocation(option.value)}
              />
            ))}
          </View>

          {/* Equipamiento */}
          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200">
            Equipamiento
          </Text>
          <Text className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
            ¿Con qué materiales cuentas?
          </Text>

          {isLoadingEquipment ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color={brandColor} />
              <Text className="text-slate-500 dark:text-zinc-400 mt-4">
                Cargando equipamiento...
              </Text>
            </View>
          ) : (
            <View className="flex-1 z-50">
              <EquipmentSelect
                equipments={equipmentList}
                selectedEquipment={selectedEquipment}
                onSelectionChange={setSelectedEquipment}
                placeholder="Seleccionar - Opcional"
              />
            </View>
          )}
        </Pressable>

        {/* Footer */}
        <View className="items-center mb-[34px] mt-4">
          <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-4 px-6 leading-5">
            Puedes editar estos datos luego.
          </Text>
          <TouchableOpacity
            style={[
              { backgroundColor: brandColor },
              isSubmitting && { opacity: 0.7 },
            ]}
            className="w-full py-5 rounded-2xl items-center shadow-md"
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              Continuar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </SwipeBackWrapper>
  );
}
