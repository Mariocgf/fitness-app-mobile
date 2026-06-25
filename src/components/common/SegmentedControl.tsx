import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** Acento del segmento activo. */
export type SegmentedAccent = 'lime' | 'amber' | 'rose' | 'mono';

const ACTIVE_TEXT: Record<SegmentedAccent, string> = {
  lime: 'text-lime-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  mono: 'text-white',
};

/** Relleno del segmento activo en variante `solid`. */
const ACTIVE_FILL: Record<SegmentedAccent, string> = {
  lime: 'bg-lime-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  mono: 'bg-zinc-50',
};

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Color del acento del segmento activo. Default `mono`. */
  accent?: SegmentedAccent;
  /**
   * Estilo del segmento activo:
   * - `subtle` (default): resalte tenue `zinc-800` + texto del acento (toggles IA/Manual).
   * - `solid`: relleno completo del acento + texto `zinc-900` (selector de la maqueta de onboarding).
   */
  variant?: 'subtle' | 'solid';
}

/**
 * Control segmentado dark-only (estilo iOS): contenedor `zinc-900` con un riel.
 * Dos estilos de segmento activo según `variant`:
 * - `subtle`: resalte `zinc-800` + texto del acento.
 * - `solid`: relleno del acento + texto oscuro.
 *
 * Reutilizar SIEMPRE para toggles/selectores de 2-3 opciones excluyentes
 * en vez de copiar `TouchableOpacity` con ternarios de fondo.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = 'mono',
  variant = 'subtle',
}: SegmentedControlProps<T>) {
  const isSolid = variant === 'solid';
  return (
    <View className="flex-row bg-zinc-900 border border-zinc-800 rounded-xl p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        const activeBg = isSolid ? ACTIVE_FILL[accent] : 'bg-zinc-800';
        const activeText = isSolid ? 'text-zinc-900' : ACTIVE_TEXT[accent];
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            activeOpacity={0.8}
            className={`flex-1 items-center py-2.5 rounded-lg ${isActive ? activeBg : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${isActive ? activeText : 'text-zinc-400'}`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
