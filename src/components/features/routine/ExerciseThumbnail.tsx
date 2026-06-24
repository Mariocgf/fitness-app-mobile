/**
 * Miniatura de ejercicio: muestra el gif/imagen si hay URL, o un placeholder
 * con ícono. Átomo reutilizable — antes estaba copiado en detalle, edición,
 * creación, sesión y los modales de swap.
 *
 * Usa `expo-image` con `cachePolicy="memory-disk"`: las miniaturas se cachean en
 * memoria y disco, así no se re-descargan al scrollear las listas de ejercicios.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

interface ExerciseThumbnailProps {
  /** URL del gif/imagen. Si es null/undefined se muestra el placeholder. */
  uri?: string | null;
  /** Lado del cuadrado en px (default 64). */
  size?: number;
  /** Clases del contenedor: fondo + margen. Default fondo oscuro (zinc-800). */
  className?: string;
  /** Color del ícono placeholder (default zinc-600). */
  iconColor?: string;
}

export const ExerciseThumbnail: React.FC<ExerciseThumbnailProps> = ({
  uri,
  size = 64,
  className = 'bg-zinc-800',
  iconColor = '#52525b',
}) => {
  const dim = { width: size, height: size };
  if (uri) {
    return (
      <View style={dim} className={`rounded-xl overflow-hidden ${className}`}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }
  return (
    <View style={dim} className={`rounded-xl items-center justify-center ${className}`}>
      <Ionicons name="image-outline" size={Math.round(size * 0.34)} color={iconColor} />
    </View>
  );
};
