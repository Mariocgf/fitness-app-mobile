import { Ionicons } from '@expo/vector-icons';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    Text,
    View
} from 'react-native';

import CheckableCard from '@/src/components/common/CheckableCard';
import EquipmentSelect from '@/src/components/common/EquipmentSelect';
import EquipmentSelectedList from '@/src/components/common/EquipmentSelectedList';
import FieldSection from '@/src/components/common/FieldSection';
import { translateSubGoalDescription, translateSubGoalName } from '@/src/i18n';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import SelectableCard from '@/src/components/common/SelectableCard';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import WeekDayPicker from '@/src/components/common/WeekDayPicker';
import WheelPicker from '@/src/components/common/WheelPicker';
import { useFitnessConfigStep } from '@/src/hooks/useFitnessConfigStep';
import {
    EXPERIENCE_LEVEL_OPTIONS,
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
 * Se compone de 4 pantallas internas (la lógica vive en `useFitnessConfigStep`):
 *   - SubStep 0: Nivel de experiencia + Nivel de actividad
 *   - SubStep 1: Sub-objetivos
 *   - SubStep 2: Disponibilidad (días) + Duración de sesión
 *   - SubStep 3: Entorno + Equipamiento → envía POST
 */
export default function FitnessConfigStep({
  brandColor,
  moduleId,
  globalGoalName,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: FitnessConfigStepProps) {
  const {
    subStep,
    setSubStep,
    experienceLevel,
    setExperienceLevel,
    trainingHistory,
    setTrainingHistory,
    handleContinueStep0,
    subGoals,
    selectedSubGoalIds,
    isLoadingSubGoals,
    toggleSubGoal,
    selectedDays,
    setSelectedDays,
    hasFlexibleTime,
    setHasFlexibleTime,
    sessionDuration,
    setSessionDuration,
    equipmentList,
    selectedEquipment,
    setSelectedEquipment,
    isLoadingEquipment,
    selectedWithDetails,
    setEquipmentQty,
    removeEquipment,
    handleSubmit,
  } = useFitnessConfigStep({ moduleId, onComplete, setIsSubmitting });

  // ═══════════════════════════════════════════════════════════════════
  // PANTALLA 1: Experiencia + Actividad
  // ═══════════════════════════════════════════════════════════════════
  if (subStep === 0) {
    return (
      <View className="flex-1 bg-zinc-950">
        <ProgressBar currentStep={subStep} totalSteps={4} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHeader
            title={"Perfil de\nentrenamiento"}
            subtitle="Conocer tu experiencia nos ayudará a ajustar la intensidad de tus entrenamientos."
            centered
          />

          {/* Nivel de experiencia → selector segmentado sólido */}
          <FieldSection
            eyebrow="Nivel de experiencia"
            question="¿Cuál es tu punto de partida?"
          >
            <SegmentedControl
              options={EXPERIENCE_LEVEL_OPTIONS}
              value={experienceLevel}
              onChange={setExperienceLevel}
              accent="lime"
              variant="solid"
            />
          </FieldSection>

          {/* Divisor entre secciones */}
          <View className="h-px bg-zinc-800 my-8" />

          {/* Nivel de actividad (trainingHistory) → lista de selección única */}
          <FieldSection
            eyebrow="Nivel de actividad"
            question="¿Hace cuánto entrenas?"
          >
            <View className="gap-3">
              {TRAINING_HISTORY_OPTIONS.map((option) => (
                <CheckableCard
                  key={option.value}
                  isSelected={trainingHistory === option.value}
                  label={option.label}
                  onPress={() => setTrainingHistory(option.value)}
                  variant="radio"
                  accent="lime"
                />
              ))}
            </View>
          </FieldSection>
        </ScrollView>

        <OnboardingFooter
          onPress={handleContinueStep0}
          helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
          helperIcon={<Ionicons name="sparkles-outline" size={18} className="text-zinc-400" />}
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
        <View className="flex-1 bg-zinc-950">
          <ProgressBar currentStep={subStep} totalSteps={4} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Define tu enfoque principal para personalizar tus rutinas y progresión."
              centered
            />

            <FieldSection eyebrow="Sub objetivo" question="¿Qué quieres lograr?">
              {isLoadingSubGoals ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="large" color={brandColor} />
                  <Text className="text-zinc-400 mt-4">
                    Cargando objetivos...
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {subGoals.map((goal) => (
                    <CheckableCard
                      key={goal.id}
                      isSelected={selectedSubGoalIds.includes(goal.id)}
                      label={translateSubGoalName(goal.name)}
                      description={translateSubGoalDescription(goal.description)}
                      onPress={() => toggleSubGoal(goal.id)}
                      variant="radio"
                      accent="lime"
                    />
                  ))}
                </View>
              )}
            </FieldSection>
          </ScrollView>

          <OnboardingFooter
            onPress={() => setSubStep(2)}
            helperText="Usaremos estos datos para darte planes más personalizados. Puedes editarlos luego."
            helperIcon={<Ionicons name="sparkles-outline" size={18} className="text-zinc-400" />}
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
        <View className="flex-1 bg-zinc-950">
          <ProgressBar currentStep={subStep} totalSteps={4} />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <OnboardingHeader
              title={"Perfil de\nentrenamiento"}
              subtitle="Adaptaremos tus entrenamientos a tu rutina y tiempo disponible."
              centered
            />

            {/* Disponibilidad → días en círculos con acento lime */}
            <FieldSection
              eyebrow="Disponibilidad"
              question="¿Qué días tienes disponibles?"
            >
              <WeekDayPicker
                days={WEEKDAY_OPTIONS}
                selectedDays={selectedDays}
                onChange={setSelectedDays}
                accent="lime"
              />
            </FieldSection>

            {/* Divisor entre secciones */}
            <View className="h-px bg-zinc-800 my-10" />

            {/* Duración por sesión → toggle "Tengo tiempo / Elegir tiempo" + rueda */}
            <FieldSection
              eyebrow="Duración por sesión"
              question="¿Cuánto tiempo dispones para entrenar?"
            >
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <SelectableCard
                    isSelected={hasFlexibleTime}
                    label="Tengo tiempo"
                    onPress={() => setHasFlexibleTime(true)}
                    textSize="sm"
                    size="auto"
                  />
                </View>
                <View className="flex-1">
                  <SelectableCard
                    isSelected={!hasFlexibleTime}
                    label="Elegir tiempo"
                    onPress={() => setHasFlexibleTime(false)}
                    textSize="sm"
                    size="auto"
                  />
                </View>
              </View>

              {/* Rueda de duración — solo si "Elegir tiempo" */}
              {!hasFlexibleTime && (
                <View className="mt-6">
                  <WheelPicker
                    label="Duración por sesión"
                    min={15}
                    max={120}
                    value={sessionDuration}
                    step={5}
                    unit="min"
                    onChange={setSessionDuration}
                    accent="lime"
                    wheelHeight={150}
                  />
                </View>
              )}
            </FieldSection>
          </ScrollView>

          <OnboardingFooter
            onPress={() => setSubStep(3)}
            helperText="Usaremos estos datos para adaptar la duración de tus entrenamientos."
            helperIcon={<Ionicons name="information-circle-outline" size={18} className="text-zinc-400" />}
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
      <View className="flex-1 bg-zinc-950">
        <ProgressBar currentStep={3} totalSteps={4} />

        {/* Backdrop: cierra el dropdown del buscador al tocar fuera */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        />

        {/* Sección fija: header + buscador (el dropdown se superpone a la lista) */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, zIndex: 20 }}>
          <OnboardingHeader
            title={"Perfil de\nentrenamiento"}
            subtitle="Conocer tu equipamiento nos ayudará a crear entrenamientos más precisos."
            centered
          />

          {/* Equipamiento → buscador "al aire" */}
          <FieldSection
            eyebrow="Equipamiento"
            question="¿Con qué materiales cuentas?"
          >
            {isLoadingEquipment ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="large" color={brandColor} />
                <Text className="text-zinc-400 mt-4">
                  Cargando equipamiento...
                </Text>
              </View>
            ) : (
              <EquipmentSelect
                equipments={equipmentList}
                selectedEquipment={selectedEquipment}
                onSelectionChange={setSelectedEquipment}
                placeholder="Buscar equipamiento"
              />
            )}
          </FieldSection>
        </View>

        {/* Lista de equipamiento seleccionado → scroll propio */}
        {selectedWithDetails.length > 0 && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <EquipmentSelectedList
              items={selectedWithDetails.map((item) => ({
                id: String(item.id),
                name: item.name,
                qty: item.qty,
              }))}
              onChangeQty={setEquipmentQty}
              onRemove={removeEquipment}
              onClearAll={() => setSelectedEquipment([])}
              accent="lime"
            />
          </ScrollView>
        )}

        {/* Empuja el footer abajo cuando no hay lista que ocupe el espacio */}
        {selectedWithDetails.length === 0 && <View className="flex-1" />}

        <OnboardingFooter
          onPress={handleSubmit}
          disabled={isSubmitting}
          helperText="Usaremos estos datos para adaptar mejor tus entrenamientos a lo que tienes."
          helperIcon={<Ionicons name="information-circle-outline" size={18} className="text-zinc-400" />}
        />
      </View>
    </SwipeBackWrapper>
  );
}
