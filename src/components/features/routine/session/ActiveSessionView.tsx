import { SessionHeader } from '@/src/components/common/SessionHeader';
import { useActiveSession } from '@/src/hooks/useActiveSession';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { SessionDay, SessionLog } from '@/src/types/session';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CountdownPhase } from './CountdownPhase';
import { ExercisePhase } from './ExercisePhase';
import { RestPhase } from './RestPhase';
import { SetActionButtons } from './SetActionButtons';
import { SummaryPhase } from './SummaryPhase';

interface ActiveSessionViewProps {
  routineId: string;
  day: SessionDay;
  /** Nombre de la rutina, para el resumen final */
  routineName?: string;
  /** Etiqueta del próximo día de la rutina, para el resumen final */
  nextSessionDay?: string;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  routineId,
  day,
  routineName,
  nextSessionDay,
  onFinishSession,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const session = useActiveSession({ routineId, day, onFinishSession, onCancel });

  if (!session.currentExercise && session.phase !== 'SUMMARY') return null;

  /* ══════════════════════ COUNTDOWN ══════════════════════ */
  if (session.phase === 'COUNTDOWN') {
    return <CountdownPhase countdown={session.countdown} />;
  }

  /* ══════════════════════ SUMMARY ══════════════════════ */
  if (session.phase === 'SUMMARY') {
    return (
      <SummaryPhase
        globalTime={session.globalTime}
        stats={session.summaryStats}
        routineName={routineName}
        nextSessionDay={nextSessionDay}
        onSave={session.handleSaveSession}
      />
    );
  }

  /* ══════════════════════ EXERCISE ↔ REST ══════════════════════ */
  /* El header y la sección de botones quedan FIJOS (fuera de la animación):
     solo el contenido central hace cross-dissolve (FadeInDown / FadeOut) al
     cambiar de fase, disparado por el `key={phase}`. */
  const isRest = session.phase === 'REST';

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <SessionHeader
        title={isRest ? 'Descanso' : session.currentExercise.name}
        onBack={onCancel!}
        action={
          isRest
            ? undefined
            : { icon: 'information-circle-outline', onPress: () => session.setShowInstructions(true) }
        }
      />

      {/* Contenido central (lo único que se anima) */}
      <Animated.View
        key={session.phase}
        entering={FadeInDown.duration(260)}
        exiting={FadeOut.duration(180)}
        style={{ flex: 1 }}
      >
        {isRest ? (
          <RestPhase
            restTimeLeft={session.restTimeLeft}
            initialRest={session.initialRest}
            nextExercise={session.nextExercise}
            isLastSession={session.isLastExerciseAndSet}
            rpe={session.rpe}
            onRpeChange={session.setRpe}
            onSaveRpe={session.handleSaveRpe}
            rpeDisabled={session.rpeSaved}
            isAdjustingLoad={session.isAdjustingLoad}
            canUpdateRpe={session.canUpdateRpe}
            isOffline={!isOnline}
            repetitionMode={session.repetitionMode}
            partialReps={session.partialReps}
            onPartialRepsChange={session.setPartialReps}
            repetitionMax={session.repetitionMax}
          />
        ) : (
          <ExercisePhase
            currentExercise={session.currentExercise}
            currentSet={session.currentSet}
            totalSets={session.totalSets}
            isTimeBased={session.isTimeBased}
            exerciseTimeLeft={session.exerciseTimeLeft}
            globalTime={session.globalTime}
            showInstructions={session.showInstructions}
            onCloseInstructions={() => session.setShowInstructions(false)}
          />
        )}
      </Animated.View>

      {/* Sección de botones FIJA (mismo tamaño/posición; el contenido cambia por fase) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <SetActionButtons
          left={
            isRest
              ? { label: 'Finalizar rutina', icon: 'flag-outline', onPress: session.handleFinishSessionEarly }
              : { label: 'Serie incompleta', icon: 'ban-outline', onPress: session.handleIncompleteSet }
          }
          right={
            isRest
              ? { label: 'Saltar descanso', icon: 'play-skip-forward-outline', onPress: session.handleFinishRest }
              : { label: 'Completar serie', icon: 'checkmark', onPress: session.handleFinishSet }
          }
          onFinish={isRest ? undefined : session.handleFinishSessionEarly}
        />
      </View>
    </View>
  );
};
