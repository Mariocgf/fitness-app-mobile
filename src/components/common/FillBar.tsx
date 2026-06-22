import React from 'react';
import { View } from 'react-native';

type Accent = 'amber' | 'lime' | 'mono';

const ACCENT_FILL: Record<Accent, string> = {
  amber: 'bg-amber-400',
  lime: 'bg-lime-400',
  mono: 'bg-zinc-50',
};

interface FillBarProps {
  /** Progreso de relleno entre 0 y 1 (se acota internamente) */
  progress: number;
  /** Color del relleno (default amber del módulo nutrición) */
  accent?: Accent;
  /** Alto de la barra como clase Tailwind (default `h-2`) */
  heightClassName?: string;
  /** Clases extra para el track */
  className?: string;
}

/**
 * Barra de relleno horizontal: track `bg-zinc-800` + relleno del acento.
 * Átomo para mostrar progreso/porcentaje sin lógica propia.
 */
export function FillBar({
  progress,
  accent = 'amber',
  heightClassName = 'h-2',
  className,
}: FillBarProps) {
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <View className={`${heightClassName} rounded-full bg-zinc-800 overflow-hidden ${className ?? ''}`}>
      <View
        className={`${heightClassName} rounded-full ${ACCENT_FILL[accent]}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </View>
  );
}
