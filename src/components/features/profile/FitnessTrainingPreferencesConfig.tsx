import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RulerPicker from '@/src/components/common/RulerPicker';
import SectionCard from '@/src/components/common/SectionCard';
import WeekDayPicker from '@/src/components/common/WeekDayPicker';
import {
  getTrainingPreferences,
  updateTrainingPreferences,
} from '@/src/services/fitness.service';
import { FitnessDay, WEEKDAY_OPTIONS } from '@/src/types/fitness';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface FitnessTrainingPreferencesConfigProps {
  onBack: () => void;
  onRegisterBackHandler?: (fn: (() => void) | null) => void;
}

const dayToPickerValue: Record<FitnessDay, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const pickerValueToDay: Record<number, FitnessDay> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  0: 'sunday',
};

const DEFAULT_SESSION_DURATION = 60;

const toPickerDays = (days: FitnessDay[]) => days.map((day) => dayToPickerValue[day]);

const toFitnessDays = (days: number[]) =>
  days
    .map((day) => pickerValueToDay[day])
    .filter((day): day is FitnessDay => Boolean(day));

const areSameDays = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  return a.every((day) => b.includes(day));
};

/**
 * Sub-pantalla para editar días disponibles y duración de entrenamiento.
 */
export default function FitnessTrainingPreferencesConfig({
  onBack,
  onRegisterBackHandler,
}: FitnessTrainingPreferencesConfigProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const onRegisterBackHandlerRef = useRef(onRegisterBackHandler);
  onRegisterBackHandlerRef.current = onRegisterBackHandler;
  const insets = useSafeAreaInsets();

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [initialDays, setInitialDays] = useState<number[]>([]);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_SESSION_DURATION);
  const [initialSessionDuration, setInitialSessionDuration] = useState(DEFAULT_SESSION_DURATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getTokenRef.current();
        const preferences = await getTrainingPreferences(token);
        const mappedDays = toPickerDays(
          Array.isArray(preferences.preferredWorkoutDays)
            ? preferences.preferredWorkoutDays
            : []
        );
        const duration =
          preferences.sessionDurationPreference > 0
            ? preferences.sessionDurationPreference
            : DEFAULT_SESSION_DURATION;

        setSelectedDays(mappedDays);
        setInitialDays(mappedDays);
        setSessionDuration(duration);
        setInitialSessionDuration(duration);
      } catch (error) {
        console.error('Error cargando preferencias de entrenamiento:', error);
        Alert.alert('Error', 'No se pudieron cargar tus preferencias de entrenamiento.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const hasChanges = useMemo(
    () =>
      sessionDuration !== initialSessionDuration ||
      !areSameDays(selectedDays, initialDays),
    [sessionDuration, initialSessionDuration, selectedDays, initialDays]
  );

  const backHandlerRef = useRef<() => void>(() => {});
  backHandlerRef.current = () => {
    if (!hasChanges) {
      onBack();
      return;
    }

    Alert.alert(
      'Cambios sin guardar',
      'Tus cambios de disponibilidad no se guardaron. ¿Querés salir de todas formas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir sin guardar', style: 'destructive', onPress: onBack },
      ]
    );
  };

  useEffect(() => {
    onRegisterBackHandlerRef.current?.(() => backHandlerRef.current());
    return () => onRegisterBackHandlerRef.current?.(null);
  }, []);

  const handleSave = async () => {
    const preferredWorkoutDays = toFitnessDays(selectedDays);

    if (preferredWorkoutDays.length === 0) {
      Alert.alert('Falta información', 'Seleccioná al menos un día para entrenar.');
      return;
    }

    if (sessionDuration <= 0) {
      Alert.alert('Falta información', 'La duración debe ser mayor a 0 minutos.');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getTokenRef.current();
      await updateTrainingPreferences(
        {
          sessionDurationPreference: sessionDuration,
          preferredWorkoutDays,
        },
        token
      );

      setInitialDays([...selectedDays]);
      setInitialSessionDuration(sessionDuration);
      Alert.alert('Éxito', 'Preferencias de entrenamiento actualizadas correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando preferencias de entrenamiento:', error);
      Alert.alert('Error', 'No se pudieron actualizar tus preferencias de entrenamiento.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#64748b" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
          gap: 16,
        }}
      >
        <SectionCard
          icon={<Ionicons name="calendar-outline" size={20} className="text-slate-500" />}
          title="Disponibilidad"
          subtitle="¿Qué días tenés disponibles?"
        >
          <WeekDayPicker
            days={WEEKDAY_OPTIONS}
            selectedDays={selectedDays}
            onChange={setSelectedDays}
          />
        </SectionCard>

        <SectionCard
          icon={<Ionicons name="time-outline" size={20} className="text-slate-500" />}
          title="Duración"
          subtitle="¿Cuánto tiempo podés entrenar?"
        >
          <RulerPicker
            label="Tiempo"
            min={15}
            max={120}
            initial={sessionDuration}
            step={5}
            unit="min"
            onValueChange={setSessionDuration}
          />
        </SectionCard>
      </ScrollView>

      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 8 }}
        className="px-4 pt-3 bg-white dark:bg-slate-950"
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-slate-950 dark:bg-slate-100"
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-white dark:text-slate-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
