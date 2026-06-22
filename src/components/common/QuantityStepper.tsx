import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

/** Color del acento de los botones +/-. */
const ACCENT_COLORS = {
  amber: '#fbbf24',
  lime: '#a3e635',
  mono: '#fafafa',
} as const;

type StepperAccent = keyof typeof ACCENT_COLORS;

interface QuantityStepperProps {
  /** Valor actual */
  value: number;
  /** Se invoca con el nuevo valor ya acotado a [min, max] */
  onChange: (value: number) => void;
  /** Incremento por toque (default 5) */
  step?: number;
  /** Mínimo permitido (default 0) */
  min?: number;
  /** Máximo permitido (default 9999) */
  max?: number;
  /** Unidad mostrada junto al valor (default `g`) */
  unit?: string;
  /** Color del acento de los botones (default `amber`) */
  accent?: StepperAccent;
}

/** Botón circular con borde del acento para +/-. */
function StepButton({
  icon,
  color,
  disabled,
  onPress,
}: {
  icon: 'remove' | 'add';
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={{ borderColor: color, opacity: disabled ? 0.35 : 1 }}
      className="w-10 h-10 rounded-full border items-center justify-center"
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

/**
 * Átomo de selector de cantidad: `−  valor unidad  +`. Dos botones circulares con
 * el valor centrado. No usa gestos propios (solo toques), así que puede vivir
 * dentro de un `Pressable` o `ScrollView` sin pelearse con el responder system.
 * Reutilizar SIEMPRE en vez de copiar el bloque de dos botones con un valor en medio.
 */
export function QuantityStepper({
  value,
  onChange,
  step = 5,
  min = 0,
  max = 9999,
  unit = 'g',
  accent = 'amber',
}: QuantityStepperProps) {
  const color = ACCENT_COLORS[accent];

  return (
    <View className="flex-row items-center justify-between bg-zinc-800/60 rounded-full px-2 py-1.5">
      <StepButton
        icon="remove"
        color={color}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
      />
      <Text className="text-white text-base font-semibold">
        {Math.round(value)} {unit}
      </Text>
      <StepButton
        icon="add"
        color={color}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
      />
    </View>
  );
}
