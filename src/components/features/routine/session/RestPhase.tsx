import { SessionSlider } from '@/src/components/common/SessionSlider';
import { TimerCard } from '@/src/components/features/TimerCard';
import { RepetitionMode } from '@/src/hooks/useActiveSession';
import { formatTime } from '@/src/utils/format.utils';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
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
  partialReps: number;
  onPartialRepsChange: (value: number) => void;
  repetitionMax: number;
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
  partialReps,
  onPartialRepsChange,
  repetitionMax,
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
        {repetitionMode === 'partial' && (
          <View>
            <Text className="text-slate-900 dark:text-slate-50 font-bold text-xl mb-3">
              Repeticiones realizadas
            </Text>
            <SessionSlider
              value={partialReps}
              onValueChange={onPartialRepsChange}
              min={0}
              max={repetitionMax}
            />
          </View>
        )}
      </View>

    </Animated.View>
  );
};
