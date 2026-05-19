import React, { useRef } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface SessionSliderProps {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const THUMB_SIZE = 32;
const SPRING_CONFIG = { damping: 15, stiffness: 200 };

export const SessionSlider: React.FC<SessionSliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 10,
  disabled = false,
}) => {
  const trackLayoutRef = useRef({ width: 0 });
  const thumbScale = useSharedValue(1);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const resolveValue = (localX: number) => {
    const trackW = trackLayoutRef.current.width;
    if (trackW === 0) return value;
    let pct = localX / trackW;
    pct = Math.max(0, Math.min(1, pct));
    return clamp(Math.round(min + pct * (max - min)));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      thumbScale.value = withSpring(1.15, SPRING_CONFIG);
    })
    .onUpdate((e) => {
      if (!disabled) onValueChange(resolveValue(e.x));
    })
    .onEnd(() => {
      thumbScale.value = withSpring(1, SPRING_CONFIG);
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (!disabled) onValueChange(resolveValue(e.x));
    });

  const composed = Gesture.Race(pan, tap);

  const percentage = max === min ? 0 : (value - min) / (max - min);

  const isAtEdge = value === min || value === max;

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: value === min ? 0 : 1,
    transform: [{ scale: value === min ? 0.8 : 1 }],
  }));

  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: value === max ? 0 : 1,
    transform: [{ scale: value === max ? 0.8 : 1 }],
  }));

  return (
    <View className="w-full flex-row items-center py-3">
      <Animated.Text
        style={leftLabelStyle}
        className="text-slate-900 dark:text-slate-50 font-bold text-base w-6 text-center"
      >
        {min}
      </Animated.Text>

      <GestureDetector gesture={composed}>
        <View
          className="flex-1 h-10 justify-center mx-2"
          onLayout={(e: LayoutChangeEvent) => {
            trackLayoutRef.current = { width: e.nativeEvent.layout.width };
          }}
        >
          <View className="absolute left-0 right-0 flex-row h-[5px] rounded-full overflow-hidden">
            <View
              className="h-full bg-slate-900 dark:bg-slate-50 rounded-full"
              style={{ width: `${percentage * 100}%` }}
            />
            <View
              className="h-full bg-slate-300 dark:bg-slate-700 rounded-full"
              style={{ width: `${(1 - percentage) * 100}%` }}
            />
          </View>

          <Animated.View
            style={[
              {
                left: `${percentage * 100}%`,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
              },
              thumbAnimStyle,
            ]}
            className={`absolute rounded-full items-center justify-center ${
              isAtEdge
                ? 'bg-slate-900 dark:bg-slate-50 border-4 border-lime-400'
                : 'bg-slate-900 dark:bg-slate-50'
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                isAtEdge
                  ? 'text-white dark:text-slate-900'
                  : 'text-white dark:text-slate-900'
              }`}
            >
              {value}
            </Text>
          </Animated.View>
        </View>
      </GestureDetector>

      <Animated.Text
        style={rightLabelStyle}
        className="text-slate-900 dark:text-slate-50 font-bold text-base w-6 text-center"
      >
        {max}
      </Animated.Text>
    </View>
  );
};
