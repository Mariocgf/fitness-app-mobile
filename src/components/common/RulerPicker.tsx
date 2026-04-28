import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface RulerPickerProps {
  label: string;
  min: number;
  max: number;
  initial: number;
  step?: number;
  unit: string;
  onValueChange: (value: number) => void;
}

const TICK_SPACING = 12;
const TICK_WIDTH = 2;

/**
 * Componente de selector tipo "regla" horizontal.
 * El usuario desliza la regla y un indicador central fijo marca el valor seleccionado.
 */
export default function RulerPicker({
  label,
  min,
  max,
  initial,
  step = 1,
  unit,
  onValueChange,
}: RulerPickerProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentValue, setCurrentValue] = useState(initial);
  const lastHapticValue = useRef(initial);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasInitialized = useRef(false);

  const totalTicks = Math.floor((max - min) / step);
  const containerWidth = SCREEN_WIDTH - 64;

  // Pre-render ticks
  const ticks = useMemo(() => {
    const items = [];
    for (let i = 0; i <= totalTicks; i++) {
      const value = min + i * step;
      const isMajor = value % 10 === 0;
      const isMid = value % 5 === 0 && !isMajor;

      let tickHeight = 20;
      let tickColor = isDark ? '#555' : '#ccc';

      if (isMajor) {
        tickHeight = 44;
        tickColor = isDark ? '#aaa' : '#333';
      } else if (isMid) {
        tickHeight = 32;
        tickColor = isDark ? '#777' : '#888';
      }

      items.push(
        <View
          key={i}
          style={{
            width: TICK_WIDTH,
            height: tickHeight,
            backgroundColor: tickColor,
            marginHorizontal: (TICK_SPACING - TICK_WIDTH) / 2,
            borderRadius: 1,
          }}
        />
      );
    }
    return items;
  }, [totalTicks, min, step, isDark]);

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const tickIndex = offsetX / TICK_SPACING;
      const rawValue = min + tickIndex * step;
      const snapped = Math.round(rawValue / step) * step;
      const clampedValue = Math.min(max, Math.max(min, snapped));

      if (clampedValue !== currentValue) {
        setCurrentValue(clampedValue);
        onValueChange(clampedValue);

        // Haptic feedback al cambiar de valor (throttled cada 2 unidades para no saturar)
        if (Math.abs(clampedValue - lastHapticValue.current) >= 2) {
          lastHapticValue.current = clampedValue;
          Haptics.selectionAsync().catch(() => {});
        }
      }
    },
    [min, max, step, currentValue, onValueChange]
  );

  const handleLayout = useCallback(() => {
    if (!hasInitialized.current && scrollViewRef.current) {
      hasInitialized.current = true;
      const initialOffset = ((initial - min) / step) * TICK_SPACING;
      scrollViewRef.current.scrollTo({ x: initialOffset, animated: false });
    }
  }, [initial, min, step]);

  return (
    <View className="items-center mb-6">
      {/* Label */}
      <Text className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-4">
        {label}
      </Text>

      {/* Ruler container */}
      <View style={{ width: containerWidth, height: 80, justifyContent: 'center' }} className="relative">
        {/* Indicador central fijo — pixel-perfect */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (containerWidth / 2) - (TICK_WIDTH / 2),
            top: 14,
            width: TICK_WIDTH,
            height: 52,
            backgroundColor: isDark ? '#fff' : '#000',
            zIndex: 10,
            borderRadius: 2,
          }}
        />

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_SPACING}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onLayout={handleLayout}
          contentContainerStyle={{
            paddingHorizontal: (containerWidth / 2) - (TICK_SPACING / 2),
            alignItems: 'flex-end',
            height: 60,
          }}
        >
          {ticks}
        </ScrollView>
      </View>

      {/* Valor actual */}
      <Text className="text-base text-slate-700 dark:text-zinc-300 mt-2 font-medium">
        {currentValue} {unit}
      </Text>
    </View>
  );
}
