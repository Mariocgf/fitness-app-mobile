import React from 'react';
import { Image, Text, View } from 'react-native';

interface ForumAvatarProps {
  /** URL de la foto de perfil (Clerk `imageUrl`). Sin ella se cae a la inicial. */
  uri?: string | null;
  /** Nombre del autor: de acá sale la inicial del fallback. Vacío → "?". */
  name: string;
  /** Diámetro en px. 40 en el feed, 44 en el detalle. */
  size?: number;
}

/**
 * Avatar del foro. Misma regla que el header del Home y el perfil: si hay foto se
 * muestra la foto, si no, la inicial sobre el círculo `zinc-800`.
 *
 * El tamaño va por `style` y no por clase de Tailwind porque es un número dinámico
 * (NativeWind no puede generar clases en runtime a partir de una prop).
 */
export function ForumAvatar({ uri, name, size = 40 }: ForumAvatarProps) {
  const trimmed = name.trim();
  const initial = trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="overflow-hidden bg-zinc-800 items-center justify-center"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.4 }} className="text-sky-400 font-bold">
          {initial}
        </Text>
      )}
    </View>
  );
}
