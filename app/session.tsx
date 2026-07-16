import { logger } from '@/src/utils/logger';
import React, { useCallback, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FeedbackHost, toast } from '@/src/components/ui/feedback';
import { ActiveSessionView } from '@/src/components/features/routine/session/ActiveSessionView';
import { CountdownOverlay } from '@/src/components/features/routine/session/CountdownOverlay';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { enqueueTrainingSessionOffline, refreshOfflineFitnessRoutine } from '@/src/offline/service';
import { saveSession } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { useAuth } from '@clerk/clerk-expo';
import { SessionDay, SessionLog } from '@/src/types/session';
import { ExerciseLoadPatch, applyLoadAdjustmentToRoutine } from '@/src/utils/routine-adjust.utils';
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
  const { isOnline } = useNetworkStatus();
  const { activeRoutine, setActiveRoutine } = useRoutineDetailContext();

  const [isSaving, setIsSaving] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);

  const day: SessionDay | null = dayData ? JSON.parse(dayData) : null;
  const dayId = day?.id;

  /**
   * La sesión trabaja sobre un SNAPSHOT del día (`dayData` llega serializado por params),
   * así que un ajuste de carga solo vivía dentro de la sesión y se perdía al salir: el
   * detalle seguía mostrando el peso viejo y la próxima sesión arrancaba de ahí.
   *
   * Acá se propaga a la rutina cacheada — en memoria (contexto) y en el snapshot offline
   * si el usuario lo tenía descargado.
   */
  const handleExerciseAdjusted = useCallback(
    (exerciseEntryId: string, patch: ExerciseLoadPatch) => {
      if (!activeRoutine || !dayId || activeRoutine.id !== routineId) return;

      const updated = applyLoadAdjustmentToRoutine(activeRoutine, dayId, exerciseEntryId, patch);
      setActiveRoutine(updated);

      /* El snapshot offline es best-effort: si falla, la sesión NO se rompe (el backend ya
         tiene el ajuste persistido y la próxima descarga lo trae). */
      refreshOfflineFitnessRoutine(updated).catch((error) => {
        logger.error('[SessionScreen] No se pudo refrescar el snapshot offline', error);
      });
    },
    [activeRoutine, setActiveRoutine, dayId, routineId],
  );

  const mutation = useMutation({
    mutationFn: async (log: SessionLog) => {
      const token = await getToken();
      await saveSession(log, token);
    },
    onSuccess: () => {
      toast.success("Sesión guardada correctamente.");
      router.back();
    },
    onError: (error) => {
      logger.error(error);
      toast.error("No se pudo guardar la sesión.");
      setIsSaving(false);
    }
  });

  const handleFinishSession = async (log: SessionLog) => {
    setIsSaving(true);
    if (!isOnline) {
      try {
        await enqueueTrainingSessionOffline(log);
        toast.success('La sesión se sincronizará cuando vuelva la conexión.', {
          title: 'Guardado offline',
        });
        router.back();
      } catch (error) {
        logger.error(error);
        toast.error('No se pudo guardar la sesión offline.');
        setIsSaving(false);
      }
      return;
    }
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
      {/* La rutina se monta recién cuando el countdown "3, 2, 1, GO" termina */}
      {!showCountdown && (
        <ActiveSessionView
          routineId={routineId}
          day={day}
          routineName={routineName}
          nextSessionDay={nextSessionDay}
          onFinishSession={handleFinishSession}
          onCancel={() => router.back()}
          onExerciseAdjusted={handleExerciseAdjusted}
        />
      )}
      {showCountdown && (
        <CountdownOverlay onFinish={() => setShowCountdown(false)} />
      )}
      {isSaving && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#d9f99d" />
        </View>
      )}

      {/* Esta pantalla se presenta como `fullScreenModal` (ver `app/_layout.tsx`), o sea
          en un view controller POR ENCIMA del árbol raíz. El `FeedbackHost` del layout
          raíz queda debajo: sus toasts se ven tapados y su diálogo no se puede presentar
          (aparecería recién al salir de la sesión). Montando el host acá, el feedback
          vive en el árbol de arriba y se ve donde tiene que verse.
          Solo renderiza el host más alto de la pila, así que el raíz se apaga solo. */}
      <FeedbackHost />
    </View>
  );
}
