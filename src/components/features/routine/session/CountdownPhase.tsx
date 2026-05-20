import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface CountdownPhaseProps {
  countdown: number;
}

export const CountdownPhase: React.FC<CountdownPhaseProps> = ({ countdown }) => {
  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950 items-center justify-center">
      <Animated.Text
        key={countdown}
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(400)}
        className="text-lime-400 text-8xl font-black"
      >
        {countdown > 0 ? countdown : '¡Vamos!'}
      </Animated.Text>
    </View>
  );
};
