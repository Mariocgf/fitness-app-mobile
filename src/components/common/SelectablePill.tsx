import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

/** Acento visual del estado seleccionado. */
export type PillAccent = 'mono' | 'lime' | 'amber' | 'rose';

const SELECTED_STYLES: Record<PillAccent, { container: string; text: string }> = {
  mono: { container: 'bg-zinc-50 border-zinc-50', text: 'text-zinc-950' },
  lime: { container: 'bg-lime-400 border-lime-400', text: 'text-black' },
  amber: { container: 'bg-amber-400 border-amber-400', text: 'text-black' },
  rose: { container: 'bg-rose-400 border-rose-400', text: 'text-black' },
};

const UNSELECTED = {
  container: 'bg-zinc-800 border-zinc-700',
  text: 'text-zinc-300',
};

interface SelectablePillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Color del estado seleccionado. Default `mono` (zinc-50). */
  accent?: PillAccent;
  /** Override de padding/extra. Default `px-4 py-2`. */
  className?: string;
}

/**
 * Chip seleccionable (píldora) dark-only. Estructura `rounded-full border`
 * + texto, con el acento del estado activo configurable por `accent`.
 *
 * Reutilizar SIEMPRE en filtros horizontales y selectores de día en vez de
 * copiar el bloque `TouchableOpacity rounded-full border` con su ternario.
 */
export const SelectablePill: React.FC<SelectablePillProps> = ({
  label,
  selected,
  onPress,
  accent = 'mono',
  className = 'px-4 py-2',
}) => {
  const styles = selected ? SELECTED_STYLES[accent] : UNSELECTED;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`rounded-full border ${className} ${styles.container}`}
    >
      <Text className={`text-sm font-medium ${styles.text}`}>{label}</Text>
    </TouchableOpacity>
  );
};
