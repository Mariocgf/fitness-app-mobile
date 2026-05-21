import { ThemedText } from '@/src/components/common/themed-text';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FitnessScreen() {
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const { setOnCreateRoutine, setDetailVisible } = useRoutineDetailContext();

  /** Ref para acceder al estado setter sin causar re-renders */
  const setShowRef = useRef(setShowCreateRoutine);
  const setDetailVisibleRef = useRef(setDetailVisible);
  setShowRef.current = setShowCreateRoutine;
  setDetailVisibleRef.current = setDetailVisible;

  /** Registra el handler de "Crear rutina" solo al montar */
  useEffect(() => {
    setOnCreateRoutine(() => () => {
      setShowRef.current(true);
      setDetailVisibleRef.current(true);
    });
    return () => setOnCreateRoutine(null);
  }, [setOnCreateRoutine]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <ThemedText type="title" className="text-2xl font-bold mb-2">
          Fitness
        </ThemedText>
        <ThemedText type="default" className="text-gray-500 text-center">
          Próximamente: tus rutinas, ejercicios y progreso.
        </ThemedText>
      </View>

      {/* Overlay de creación de rutina */}
      {showCreateRoutine && (
        <CreateRoutineView onClose={() => { setShowCreateRoutine(false); setDetailVisible(false); }} />
      )}
    </SafeAreaView>
  );
}
