import { SessionHeader } from '@/src/components/common/SessionHeader';
import { ExerciseActionButtons } from '@/src/components/features/ExerciseActionButtons';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useActiveSession } from '@/src/hooks/useActiveSession';
import { SessionDay, SessionLog } from '@/src/types/session';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CountdownPhase } from './CountdownPhase';
import { ExercisePhase } from './ExercisePhase';
import { ExerciseStatsBar } from './ExerciseStatsBar';
import { NextExerciseCard } from './NextExerciseCard';
import { RestActionButtons } from './RestActionButtons';
import { RestPhase } from './RestPhase';
import { SummaryPhase } from './SummaryPhase';

interface ActiveSessionViewProps {
  routineId: string;
  day: SessionDay;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  routineId,
  day,
  onFinishSession,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

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
        logs={session.logs}
        exercises={session.exercises}
        onSave={session.handleSaveSession}
      />
    );
  }

  const isRest = session.phase === 'REST';

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── CONTENEDOR BLANCO con animación interna ── */}
      <View
        style={{ paddingTop: insets.top, overflow: 'hidden' }}
        className="bg-white dark:bg-slate-900 rounded-b-3xl"
        onLayout={(e) => { session.whiteBoxHeightRef.current = e.nativeEvent.layout.height; }}
      >
        <SessionHeader
          title={isRest ? 'Descanso' : session.currentExercise.name}
          onBack={onCancel!}
          action={
            !isRest
              ? { icon: 'information-circle-outline', onPress: () => session.setShowInstructions(true) }
              : undefined
          }
        />

        {/* Zona animada */}
        <View style={{ overflow: 'hidden' }}>
          <ExercisePhase
            currentExercise={session.currentExercise}
            exerciseIndex={session.exerciseIndex}
            currentSet={session.currentSet}
            totalSets={session.totalSets}
            isTimeBased={session.isTimeBased}
            exerciseTimeLeft={session.exerciseTimeLeft}
            timeBasedDuration={session.timeBasedDuration}
            globalTime={session.globalTime}
            showInstructions={session.showInstructions}
            onToggleInstructions={() => session.setShowInstructions(!session.showInstructions)}
            exerciseBlockY={session.exerciseBlockY}
            onFinishSet={session.handleFinishSet}
            onFinishSessionEarly={session.handleFinishSessionEarly}
            onIncomplete={session.handleIncompleteSet}
          />

          <RestPhase
            restTimeLeft={session.restTimeLeft}
            initialRest={session.initialRest}
            globalTime={session.globalTime}
            exerciseIndex={session.exerciseIndex}
            currentSet={session.currentSet}
            rpe={session.rpe}
            onRpeChange={session.setRpe}
            onSaveRpe={session.handleSaveRpe}
            rpeDisabled={session.rpeSaved}
            isAdjustingLoad={session.isAdjustingLoad}
            canUpdateRpe={session.canUpdateRpe}
            repetitionMode={session.repetitionMode}
            partialReps={session.partialReps}
            onPartialRepsChange={session.setPartialReps}
            repetitionMax={session.repetitionMax}
            restBlockY={session.restBlockY}
          />
        </View>
      </View>

      {/* ── ZONA GRIS — estática ── */}
      <View className="flex-1 px-4 pt-4 pb-6 gap-4">
        {!isRest ? (
          <>
            <ExerciseStatsBar
              currentSet={session.currentSet}
              totalSets={session.totalSets}
              currentExercise={session.currentExercise}
            />
            <View className="flex-1">
              <ExerciseActionButtons
                onIncomplete={session.handleIncompleteSet}
                onFlag={session.handleFinishSessionEarly}
                onNext={session.handleFinishSet}
              />
            </View>
          </>
        ) : (
          <>
            <NextExerciseCard
              nextExercise={session.nextExercise}
              isLastSession={session.isLastExerciseAndSet}
            />
            <RestActionButtons
              onFinishSessionEarly={session.handleFinishSessionEarly}
              onFinishRest={session.handleFinishRest}
            />
          </>
        )}
      </View>
    </View>
  );
};
