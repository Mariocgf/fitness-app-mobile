import { SessionSlider } from '@/src/components/common/SessionSlider';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

export type RepetitionMode = 'partial' | 'all';

interface RepetitionSectionProps {
  mode: RepetitionMode;
  onModeChange: (mode: RepetitionMode) => void;
  partialReps: number;
  onPartialRepsChange: (value: number) => void;
  maxReps: number;
  onSave: () => void;
}

export const RepetitionSection: React.FC<RepetitionSectionProps> = ({
  mode,
  onModeChange,
  partialReps,
  onPartialRepsChange,
  maxReps,
  onSave,
}) => {
  return (
    <View>
      <Text className="text-slate-900 dark:text-slate-50 font-bold text-xl mb-3">
        Repeticiones realizadas
      </Text>
      <View className="flex-row gap-4 mb-3">
        <TouchableOpacity
          onPress={() => onModeChange('partial')}
          className={`flex-1 h-12 rounded-full items-center justify-center ${
            mode === 'partial'
              ? 'bg-slate-900 dark:bg-slate-50'
              : 'border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Text
            className={`text-base ${
              mode === 'partial' ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            Parcial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onModeChange('all')}
          className={`flex-1 h-12 rounded-full items-center justify-center ${
            mode === 'all'
              ? 'bg-slate-900 dark:bg-slate-50'
              : 'border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Text
            className={`text-base ${
              mode === 'all' ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            Todas
          </Text>
        </TouchableOpacity>
      </View>
      {mode === 'partial' && (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutUp.duration(180)}
          layout={LinearTransition.springify().damping(18)}
        >
          <SessionSlider
            value={partialReps}
            onValueChange={onPartialRepsChange}
            min={0}
            max={maxReps}
          />
          <TouchableOpacity
            className="w-full h-12 rounded-full items-center justify-center mt-2 mb-2 bg-slate-900 dark:bg-slate-50"
            onPress={onSave}
          >
            <Text className="text-white dark:text-slate-900 font-medium text-base">Actualizar</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};
