import React, { useRef } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

/** Slider de esfuerzo percibido (RPE) basado en gestos */

interface RPESliderProps {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const RPESlider: React.FC<RPESliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 10,
  disabled = false,
}) => {
  const trackLayoutRef = useRef({ width: 0 });

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  /** Resuelve el valor numérico a partir de la posición X del gesto */
  const resolveValue = (localX: number) => {
    const trackW = trackLayoutRef.current.width;
    if (trackW === 0) return value;
    let pct = localX / trackW;
    pct = Math.max(0, Math.min(1, pct));
    return clamp(Math.round(min + pct * (max - min)));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (!disabled) onValueChange(resolveValue(e.x));
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (!disabled) onValueChange(resolveValue(e.x));
    });

  const composed = Gesture.Race(pan, tap);

  const percentage = (value - min) / (max - min);

  return (
    <View className="w-full flex-row items-center py-4 px-5">
      <Text className="text-white font-bold text-lg mr-4">{min}</Text>
      <GestureDetector gesture={composed}>
        <View
          className="flex-1 h-10 justify-center"
          onLayout={(e: LayoutChangeEvent) => {
            trackLayoutRef.current = { width: e.nativeEvent.layout.width };
          }}
        >
          {/* Fondo de la pista */}
          <View className="h-2 bg-zinc-700 rounded-full w-full" />
          {/* Relleno de progreso */}
          <View
            className="absolute h-2 bg-lime-300 rounded-full"
            style={{ width: `${percentage * 100}%` }}
          />
          {/* Indicador circular */}
          <View
            className="absolute w-8 h-8 bg-lime-300 rounded-full items-center justify-center border-4 border-zinc-900"
            style={{
              left: `${percentage * 100}%`,
              transform: [{ translateX: -16 }],
            }}
          >
            <Text className="text-black font-bold text-xs">{value}</Text>
          </View>
        </View>
      </GestureDetector>
      <Text className="text-white font-bold text-lg ml-4">{max}</Text>
    </View>
  );
};
