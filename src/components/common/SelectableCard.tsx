import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface SelectableCardProps {
  /** Si el card está seleccionado */
  isSelected: boolean;
  /** Color de marca usado para el borde y texto seleccionado */
  brandColor: string;
  /** Texto principal */
  label: string;
  /** Texto secundario opcional */
  description?: string;
  /** Callback al presionar */
  onPress: () => void;
  /** Tamaño del card: 'full' (ancho completo), 'half' (~48%), 'auto' (contenido) */
  size?: 'full' | 'half' | 'auto';
  /** Tamaño del texto: 'sm' | 'base' (default) */
  textSize?: 'sm' | 'base';
}

/**
 * Tarjeta seleccionable reutilizable con borde highlight y sombra.
 * Usada en opciones de experiencia, actividad, entorno, sub-objetivos, etc.
 */
export default function SelectableCard({
  isSelected,
  brandColor,
  label,
  description,
  onPress,
  size = 'full',
  textSize = 'base',
}: SelectableCardProps) {
  const sizeClass =
    size === 'half'
      ? 'w-[48%] mb-3'
      : size === 'auto'
        ? ''
        : 'mb-3';

  const textSizeClass = textSize === 'sm' ? 'text-sm' : 'text-base';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`py-4 px-5 rounded-2xl border-2 items-center justify-center ${sizeClass} ${
        isSelected
          ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <Text
        className={`${textSizeClass} font-semibold text-center ${
          isSelected ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-zinc-200'
        }`}
      >
        {label}
      </Text>
      {description ? (
        <Text className="text-sm text-slate-500 dark:text-zinc-400 mt-1 text-center">
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
