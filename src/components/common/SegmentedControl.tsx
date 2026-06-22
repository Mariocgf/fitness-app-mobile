import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** Acento del segmento activo. */
export type SegmentedAccent = 'lime' | 'amber' | 'mono';

const ACTIVE_TEXT: Record<SegmentedAccent, string> = {
  lime: 'text-lime-400',
  amber: 'text-amber-400',
  mono: 'text-white',
};

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Color del texto del segmento activo. Default `mono`. */
  accent?: SegmentedAccent;
}

/**
 * Control segmentado dark-only (estilo iOS): contenedor `zinc-900` con un riel
 * y el segmento activo resaltado en `zinc-800` con el texto del acento.
 *
 * Reutilizar SIEMPRE para toggles de 2-3 opciones excluyentes (ej. IA/Manual)
 * en vez de copiar `TouchableOpacity` con ternarios de fondo.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = 'mono',
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row bg-zinc-900 border border-zinc-800 rounded-xl p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            activeOpacity={0.8}
            className={`flex-1 items-center py-2.5 rounded-lg ${isActive ? 'bg-zinc-800' : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${isActive ? ACTIVE_TEXT[accent] : 'text-zinc-400'}`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
