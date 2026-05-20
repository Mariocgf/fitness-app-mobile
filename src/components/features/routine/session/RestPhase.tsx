import { TimerCard } from '@/src/components/features/TimerCard';
import { RepetitionMode } from '@/src/hooks/useActiveSession';
import { formatTime } from '@/src/utils/format.utils';
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RepetitionSection } from './RepetitionSection';
import { RpeSection } from './RpeSection';

interface RestPhaseProps {
  restTimeLeft: number;
  initialRest: number;
  globalTime: number;
  exerciseIndex: number;
  currentSet: number;
  rpe: number;
  onRpeChange: (value: number) => void;
  onSaveRpe: () => void;
  rpeDisabled: boolean;
  isAdjustingLoad: boolean;
  canUpdateRpe: boolean;
  repetitionMode: RepetitionMode;
  onRepetitionModeChange: (mode: RepetitionMode) => void;
  partialReps: number;
  onPartialRepsChange: (value: number) => void;
  repetitionMax: number;
  onSaveRepetitions: () => void;
  restBlockY: { value: number };
}

export const RestPhase: React.FC<RestPhaseProps> = ({
  restTimeLeft,
  initialRest,
  globalTime,
  exerciseIndex,
  currentSet,
  rpe,
  onRpeChange,
  onSaveRpe,
  rpeDisabled,
  isAdjustingLoad,
  canUpdateRpe,
  repetitionMode,
  onRepetitionModeChange,
  partialReps,
  onPartialRepsChange,
  repetitionMax,
  onSaveRepetitions,
  restBlockY,
}) => {
  const restBlockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: restBlockY.value }],
  }));

  return (
    <Animated.View
      style={[restBlockStyle, { position: 'absolute', left: 0, right: 0, top: 0 }]}
    >
      <TimerCard
        key={`rest-${exerciseIndex}-${currentSet}`}
        mode="countdown"
        time={restTimeLeft}
        totalDuration={initialRest}
        remainingLabel={formatTime(globalTime)}
      />
      <View className="px-4 pt-4 pb-4">
        <RpeSection
          rpe={rpe}
          onRpeChange={onRpeChange}
          onSave={onSaveRpe}
          disabled={rpeDisabled}
          isLoading={isAdjustingLoad}
          canUpdate={canUpdateRpe}
        />
        <RepetitionSection
          mode={repetitionMode}
          onModeChange={onRepetitionModeChange}
          partialReps={partialReps}
          onPartialRepsChange={onPartialRepsChange}
          maxReps={repetitionMax}
          onSave={onSaveRepetitions}
        />
      </View>

    </Animated.View>
  );
};
