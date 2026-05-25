import { ExerciseActionButtons } from '@/src/components/features/ExerciseActionButtons';
import { TimerCard } from '@/src/components/features/TimerCard';
import { SessionExercise } from '@/src/types/session';
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ExerciseGif } from './ExerciseGif';
import { InstructionsModal } from './InstructionsModal';

interface ExercisePhaseProps {
  currentExercise: SessionExercise;
  exerciseIndex: number;
  currentSet: number;
  totalSets: number;
  isTimeBased: boolean;
  exerciseTimeLeft: number | null;
  timeBasedDuration: number;
  globalTime: number;
  showInstructions: boolean;
  onToggleInstructions: () => void;
  exerciseBlockY: { value: number };
  onFinishSet: () => void;
  onFinishSessionEarly: () => void;
  onIncomplete: () => void;
}

export const ExercisePhase: React.FC<ExercisePhaseProps> = ({
  currentExercise,
  exerciseIndex,
  currentSet,
  totalSets,
  isTimeBased,
  exerciseTimeLeft,
  timeBasedDuration,
  globalTime,
  showInstructions,
  onToggleInstructions,
  exerciseBlockY,
  onFinishSet,
  onFinishSessionEarly,
  onIncomplete,
}) => {
  const exerciseBlockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: exerciseBlockY.value }],
  }));

  return (
    <Animated.View style={exerciseBlockStyle}>
      <View className="w-full aspect-square">
        {currentExercise.gifUrl ? (
          <ExerciseGif uri={currentExercise.gifUrl} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ExerciseActionButtons
              onIncomplete={onIncomplete}
              onFlag={onFinishSessionEarly}
              onNext={onFinishSet}
            />
          </View>
        )}
      </View>
      <TimerCard
        key={`ex-${exerciseIndex}-${currentSet}`}
        mode={isTimeBased ? 'countdown' : 'stopwatch'}
        time={isTimeBased ? (exerciseTimeLeft ?? 0) : globalTime}
        totalDuration={isTimeBased ? timeBasedDuration : undefined}
        remainingLabel={isTimeBased && exerciseTimeLeft !== null ? String(exerciseTimeLeft) : undefined}
      />

      {currentExercise && (
        <InstructionsModal
          visible={showInstructions}
          onClose={onToggleInstructions}
          exerciseId={currentExercise.exerciseId}
          exerciseName={currentExercise.name}
        />
      )}
    </Animated.View>
  );
};
