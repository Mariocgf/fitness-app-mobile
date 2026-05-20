import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface FullPageLoaderProps {
  message?: string;
}

const RING_SIZE = 56;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Pantalla de carga minimalista con un arco giratorio animado.
 * El mensaje es opcional.
 */
export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ message }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Rotación continua y suave
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="flex-1 justify-center items-center bg-white dark:bg-zinc-950">
      <Animated.View style={spinStyle}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          {/* Pista del anillo (fondo sutil) */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#27272a"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Arco coloreado que gira */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#00c2e0"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE * 0.3} ${CIRCUMFERENCE * 0.7}`}
          />
        </Svg>
      </Animated.View>

      {message ? (
        <Text className="text-slate-400 dark:text-zinc-500 text-center px-12 leading-5 text-sm mt-8">
          {message}
        </Text>
      ) : null}
    </View>
  );
};
