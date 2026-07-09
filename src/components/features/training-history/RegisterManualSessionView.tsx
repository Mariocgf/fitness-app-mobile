/**
 * Registro manual de una sesión histórica (diseño oscuro zinc / acento lime).
 * Overlay animado (zoom desde la card del Home, mismo patrón que CreateRoutineView).
 * Reutiliza AddExerciseSheet para elegir ejercicios del catálogo (de ahí sale el
 * ExternalId de Mongo), DatePickerField para la fecha y QuantityStepper para los
 * valores de cada serie.
 */
import { CardLayout } from '@/src/components/features/routine/RoutineDetailView';
import { AddExerciseSheet } from '@/src/components/features/routine/AddExerciseSheet';
import DatePickerField from '@/src/components/common/DatePickerField';
import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { ManualExerciseCard } from '@/src/components/features/training-history/ManualExerciseCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { toast } from '@/src/components/ui/feedback';
import { useManualSessionForm } from '@/src/hooks/useManualSessionForm';
import { formatSessionDate, mapHttpErrorToFriendlyMessage } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIME = '#a3e635';

interface RegisterManualSessionViewProps {
  onClose: () => void;
  cardLayout?: CardLayout;
  /** Se invoca con el id de la sesión creada tras un guardado exitoso. */
  onCreated: (sessionId: string) => void;
}

export const RegisterManualSessionView: React.FC<RegisterManualSessionViewProps> = ({
  onClose,
  cardLayout,
  onCreated,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const form = useManualSessionForm();
  const [sheetVisible, setSheetVisible] = useState(false);

  /* ── Animación de entrada/salida (zoom desde la card) ──────────────────── */
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const performClose = useCallback(() => {
    progress.value = withTiming(0, { duration: 280, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, progress]);

  const containerStyle = useAnimatedStyle(() => {
    if (cardLayout) {
      return {
        position: 'absolute' as const,
        top: interpolate(progress.value, [0, 1], [cardLayout.y, 0], Extrapolation.CLAMP),
        left: interpolate(progress.value, [0, 1], [cardLayout.x, 0], Extrapolation.CLAMP),
        width: interpolate(progress.value, [0, 1], [cardLayout.width, screenWidth], Extrapolation.CLAMP),
        height: interpolate(progress.value, [0, 1], [cardLayout.height, screenHeight], Extrapolation.CLAMP),
        borderRadius: interpolate(progress.value, [0, 1], [24, 0], Extrapolation.CLAMP),
        overflow: 'hidden' as const,
        zIndex: 40,
      };
    }
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: screenWidth,
      height: screenHeight,
      opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP) }],
      zIndex: 40,
    };
  });

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: cardLayout ? interpolate(progress.value, [0.4, 0.8], [0, 1], Extrapolation.CLAMP) : 1,
  }));

  /* ── Guardar ───────────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    try {
      const id = await form.submit();
      toast.success('Tu sesión quedó registrada en el historial.', { title: 'Listo' });
      onCreated(id);
      performClose();
    } catch (err) {
      toast.error(mapHttpErrorToFriendlyMessage(err), { title: 'No se pudo guardar' });
    }
  }, [form, onCreated, performClose]);

  const canSave = form.isValid && !form.isSaving;

  return (
    <Animated.View style={containerStyle} className="bg-zinc-950">
      {cardLayout && (
        <Animated.View style={contentOpacity} className="absolute inset-0 bg-zinc-950" />
      )}
      <Animated.View style={cardLayout ? [{ flex: 1 }, contentOpacity] : { flex: 1 }}>
        <View className="flex-1 bg-zinc-950">
          {/* Header */}
          <View style={{ paddingTop: insets.top }} className="px-5 pt-3 pb-2 flex-row items-center">
            <TouchableOpacity
              onPress={performClose}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center mr-3"
            >
              <Ionicons name="close" size={22} color="#a3e635" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
              Registrar sesión manual
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Fecha */}
            <View className="mb-4">
              <DatePickerField
                label="Fecha del entrenamiento"
                value={form.trainedAt}
                onChange={form.setTrainedAt}
                formatValue={formatSessionDate}
                accentColor={LIME}
              />
            </View>

            {/* Duración (opcional) */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4 mb-6">
              <Text className="text-white text-lg font-bold mb-3">Duración</Text>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-400 text-sm w-16">Horas</Text>
                <View className="flex-1 ml-3">
                  <QuantityStepper
                    value={form.durationHours}
                    onChange={form.setDurationHours}
                    step={1}
                    min={0}
                    max={23}
                    unit="h"
                    accent="lime"
                    editable
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-zinc-400 text-sm w-16">Minutos</Text>
                <View className="flex-1 ml-3">
                  <QuantityStepper
                    value={form.durationMinutes}
                    onChange={form.setDurationMinutes}
                    step={5}
                    min={0}
                    max={59}
                    unit="min"
                    accent="lime"
                    editable
                  />
                </View>
              </View>
            </View>

            {/* Ejercicios */}
            <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-4">
              Ejercicios
            </Text>

            {form.exercises.length === 0 ? (
              <View className="items-center py-10 bg-zinc-900 border border-zinc-800 rounded-3xl mb-4">
                <Ionicons name="barbell-outline" size={40} color="#52525b" />
                <Text className="text-zinc-400 text-sm mt-3 text-center px-6">
                  Agregá al menos un ejercicio para registrar la sesión.
                </Text>
              </View>
            ) : (
              form.exercises.map((exercise, index) => (
                <ManualExerciseCard
                  key={exercise.key}
                  exercise={exercise}
                  index={index}
                  expanded={form.expandedKey === exercise.key}
                  onToggle={form.toggleExpanded}
                  onRemove={form.removeExercise}
                  onAddSet={form.addSet}
                  onRemoveSet={form.removeSet}
                  onUpdateSet={form.updateSet}
                />
              ))
            )}

            {/* Agregar ejercicio */}
            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.85}
              className="flex-row items-center justify-center py-4 rounded-2xl border border-lime-400 bg-lime-400/10 mt-1"
            >
              <Ionicons name="add-circle-outline" size={20} color={LIME} />
              <Text className="text-lime-400 font-bold text-base ml-2">Agregar ejercicio</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* CTA guardar (fijo abajo) */}
          <View
            style={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 }}
            className="px-5 pt-3 border-t border-zinc-900 bg-zinc-950"
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
              className={`h-[56px] rounded-full flex-row items-center justify-center gap-2 ${
                canSave ? 'bg-lime-400' : 'bg-zinc-800'
              }`}
            >
              {form.isSaving ? (
                <ActivityIndicator size="small" color="#18181b" />
              ) : (
                <Ionicons name="checkmark" size={22} color={canSave ? '#18181b' : '#52525b'} />
              )}
              <Text className={`font-bold text-base ${canSave ? 'text-zinc-900' : 'text-zinc-600'}`}>
                {form.isSaving ? 'Guardando…' : 'Guardar sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sheet de selección de ejercicios (montado solo cuando está visible) */}
        {sheetVisible && (
          <AddExerciseSheet
            visible={sheetVisible}
            onClose={() => setSheetVisible(false)}
            onAdd={form.addExercise}
            excludedExerciseIds={form.selectedExerciseIds}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};
