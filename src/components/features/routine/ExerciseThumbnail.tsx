/**
 * Miniatura de ejercicio: muestra el gif/imagen si hay URL, o un placeholder
 * con ícono. Átomo reutilizable — antes estaba copiado en detalle, edición,
 * creación, sesión y los modales de swap.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, View } from 'react-native';

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
      <Image source={{ uri }} style={dim} className={`rounded-xl ${className}`} resizeMode="cover" />
    );
  }
  return (
    <View style={dim} className={`rounded-xl items-center justify-center ${className}`}>
      <Ionicons name="image-outline" size={Math.round(size * 0.34)} color={iconColor} />
    </View>
  );
};
