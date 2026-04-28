import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';

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
      className={`py-4 px-5 rounded-2xl border-2 bg-white dark:bg-zinc-800 items-center justify-center ${sizeClass}`}
      style={[
        {
          borderColor: isSelected ? brandColor : '#e5e7eb',
        },
        isSelected
          ? {
              shadowColor: brandColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 1,
            },
      ] as ViewStyle[]}
    >
      <Text
        className={`${textSizeClass} font-semibold text-center ${
          isSelected ? '' : 'text-slate-800 dark:text-zinc-200'
        }`}
        style={isSelected ? { color: brandColor } : undefined}
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
