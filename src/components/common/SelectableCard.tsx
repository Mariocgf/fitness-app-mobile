import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface SelectableCardProps {
  /** Si el card está seleccionado */
  isSelected: boolean;
  /** Color de marca (legacy, sin uso en el render — se mantiene por compatibilidad) */
  brandColor?: string;
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
  /**
   * Estilo visual:
   * - 'filled' (default): seleccionado = relleno invertido (zinc-50). Centrado.
   * - 'outline': seleccionado = borde resaltado, fondo `zinc-900`. Estilo lista
   *   tipo "items" de la maqueta (título arriba + descripción), izquierda.
   */
  variant?: 'filled' | 'outline';
  /** Alineación del contenido. Default 'center' (se fuerza 'left' en outline). */
  align?: 'center' | 'left';
}

/**
 * Tarjeta seleccionable reutilizable.
 * - `filled`: opciones cortas en grid (experiencia, actividad, sub-objetivos).
 * - `outline`: lista de opciones tipo "items" de la maqueta (título + descripción,
 *   selección por borde). Dark-only zinc neutro.
 */
export default function SelectableCard({
  isSelected,
  label,
  description,
  onPress,
  size = 'full',
  textSize = 'base',
  variant = 'filled',
  align = 'center',
}: SelectableCardProps) {
  const sizeClass =
    size === 'half'
      ? 'w-[48%] mb-3'
      : size === 'auto'
        ? ''
        : 'mb-3';

  const textSizeClass = textSize === 'sm' ? 'text-sm' : 'text-base';
  const isLeft = variant === 'outline' || align === 'left';

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`py-5 px-5 rounded-2xl border bg-zinc-900 ${sizeClass} ${
          isSelected ? 'border-zinc-100' : 'border-zinc-800'
        }`}
      >
        <Text className={`text-base font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
          {label}
        </Text>
        {description ? (
          <Text className="text-sm text-zinc-400 mt-2">{description}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`py-4 px-5 rounded-2xl border-2 ${isLeft ? 'items-start' : 'items-center justify-center'} ${sizeClass} ${
        isSelected
          ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <Text
        className={`${textSizeClass} font-semibold ${isLeft ? 'text-left' : 'text-center'} ${
          isSelected ? 'text-white dark:text-slate-900' : 'text-slate-800 dark:text-zinc-200'
        }`}
      >
        {label}
      </Text>
      {description ? (
        <Text className={`text-sm text-slate-500 dark:text-zinc-400 mt-1 ${isLeft ? 'text-left' : 'text-center'}`}>
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
