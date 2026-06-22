import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActiveSessionView } from '@/src/components/features/routine/session/ActiveSessionView';
import { saveSession } from '@/src/services/routine.service';
import { useAuth } from '@clerk/clerk-expo';
import { SessionDay, SessionLog } from '@/src/types/session';
import { useMutation } from '@tanstack/react-query';

export default function SessionScreen() {
  const { routineId, dayData, routineName, nextSessionDay } = useLocalSearchParams<{
    routineId: string;
    dayData: string;
    routineName?: string;
    nextSessionDay?: string;
  }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  const day: SessionDay | null = dayData ? JSON.parse(dayData) : null;

  const mutation = useMutation({
    mutationFn: async (log: SessionLog) => {
      const token = await getToken();
      await saveSession(log, token);
    },
    onSuccess: () => {
      Alert.alert("Éxito", "Sesión guardada correctamente.", [
        { text: "Ok", onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la sesión.");
      setIsSaving(false);
    }
  });

  const handleFinishSession = (log: SessionLog) => {
    setIsSaving(true);
    mutation.mutate(log);
  };

  if (!day || !routineId) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#d9f99d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <ActiveSessionView
        routineId={routineId}
        day={day}
        routineName={routineName}
        nextSessionDay={nextSessionDay}
        onFinishSession={handleFinishSession}
        onCancel={() => router.back()}
      />
      {isSaving && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#d9f99d" />
        </View>
      )}
    </View>
  );
}
