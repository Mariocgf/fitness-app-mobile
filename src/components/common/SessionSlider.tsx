import React from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface SessionSliderProps {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const THUMB_SIZE = 36;
const TRACK_HEIGHT = 6;
const LABEL_WIDTH = 28;
const OUTER_GAP = 10;
const INNER_GAP = 6;

const EASE_OUT = Easing.out(Easing.cubic);

export const SessionSlider: React.FC<SessionSliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 10,
  disabled = false,
}) => {
  const trackWidthSV = useSharedValue(0);
  const trackOffsetXSV = useSharedValue(0);

  const thumbScale = useSharedValue(1);

  const pct = max === min ? 0 : (value - min) / (max - min);
  const isAtMin = value === min;
  const isAtMax = value === max;

  const thumbCenterInTrack = useDerivedValue(() => pct * trackWidthSV.value);

  const thumbXInRow = useDerivedValue(() =>
    trackOffsetXSV.value + thumbCenterInTrack.value - THUMB_SIZE / 2
  );

  const leftLineSV = useDerivedValue(() =>
    Math.max(0, thumbCenterInTrack.value - THUMB_SIZE / 2 - INNER_GAP)
  );
  const rightLineSV = useDerivedValue(() =>
    Math.max(0, trackWidthSV.value - thumbCenterInTrack.value - THUMB_SIZE / 2 - INNER_GAP)
  );

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const valueFromX = (localX: number) => {
    const w = trackWidthSV.value;
    if (w === 0) return value;
    const trackX = localX - trackOffsetXSV.value;
    return clamp(Math.round(min + Math.max(0, Math.min(1, trackX / w)) * (max - min)));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => { thumbScale.value = withTiming(1.06, { duration: 120, easing: EASE_OUT }); })
    .onUpdate((e) => {
      if (disabled) return;
      onValueChange(valueFromX(e.x));
    })
    .onEnd(() => { thumbScale.value = withTiming(1, { duration: 150, easing: EASE_OUT }); })
    .hitSlop({ top: 24, bottom: 24, left: 0, right: 0 });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (disabled) return;
      onValueChange(valueFromX(e.x));
    });

  const composed = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: thumbXInRow.value,
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transform: [{ scale: thumbScale.value }],
  }));

  const leftLineStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    width: leftLineSV.value,
  }));

  const rightLineStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    right: 0,
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
    width: rightLineSV.value,
  }));

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isAtMin ? 0 : 1, { duration: 150 }),
    transform: [{ scale: withTiming(isAtMin ? 0.5 : 1, { duration: 150 }) }],
  }));

  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isAtMax ? 0 : 1, { duration: 150 }),
    transform: [{ scale: withTiming(isAtMax ? 0.5 : 1, { duration: 150 }) }],
  }));

  return (
    <View style={{ paddingVertical: 10 }}>
      <GestureDetector gesture={composed}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: OUTER_GAP, height: THUMB_SIZE }}
          onLayout={(e) => {
            trackOffsetXSV.value = LABEL_WIDTH + OUTER_GAP;
            trackWidthSV.value = e.nativeEvent.layout.width - (LABEL_WIDTH + OUTER_GAP) * 2;
          }}
        >
          <Animated.Text
            style={[leftLabelStyle, { width: LABEL_WIDTH, textAlign: 'center', fontWeight: '700', fontSize: 15, lineHeight: THUMB_SIZE }]}
            className="text-slate-900 dark:text-slate-50"
          >
            {min}
          </Animated.Text>

          <View style={{ flex: 1, height: THUMB_SIZE }}>
            <Animated.View style={leftLineStyle} className="bg-slate-900 dark:bg-slate-50" />
            <Animated.View style={rightLineStyle} className="bg-slate-200 dark:bg-slate-700" />
          </View>

          <Animated.Text
            style={[rightLabelStyle, { width: LABEL_WIDTH, textAlign: 'center', fontWeight: '700', fontSize: 15, lineHeight: THUMB_SIZE }]}
            className="text-slate-900 dark:text-slate-50"
          >
            {max}
          </Animated.Text>

          <Animated.View style={thumbStyle} className="bg-slate-900 dark:bg-slate-50">
            <Text style={{ fontWeight: '700', fontSize: 13 }} className="text-white dark:text-slate-900">
              {value}
            </Text>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};
