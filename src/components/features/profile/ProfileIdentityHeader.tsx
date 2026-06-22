import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface ProfileIdentityHeaderProps {
  /** Nombre completo del usuario */
  fullName: string;
  /** Email del usuario */
  email: string;
  /** URL del avatar (Clerk imageUrl). Si falta, se muestran las iniciales */
  avatarUrl?: string;
  /** Etiqueta de plan (ej. "Premium") */
  plan?: string;
}

/** Deriva hasta 2 iniciales del nombre completo (ej. "Mario Gonzalez" → "MG") */
const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'U';

/**
 * Card de identidad del perfil (dark-only `zinc` neutro, rediseñada desde la maqueta):
 * card horizontal con avatar a la izquierda, nombre y badge de plan con ícono.
 * Sin acento de módulo (Perfil = "resto de la UI"). El email no se muestra: la
 * maqueta es una card limpia con nombre + plan (fidelidad a la maqueta).
 */
export const ProfileIdentityHeader: React.FC<ProfileIdentityHeaderProps> = ({
  fullName,
  avatarUrl,
  plan,
}) => (
  <View className="flex-row items-center mx-5 mb-7 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800">
    <View className="w-20 h-20 rounded-full overflow-hidden border border-zinc-800 bg-zinc-800 items-center justify-center">
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className="text-2xl font-bold text-zinc-100">{getInitials(fullName)}</Text>
      )}
    </View>

    <View className="flex-1 ml-4">
      <Text className="text-xl font-bold text-white" numberOfLines={1}>
        {fullName}
      </Text>

      {plan ? (
        <View className="flex-row items-center self-start mt-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1">
          <Ionicons name="diamond-outline" size={13} color="#d4d4d8" />
          <Text className="ml-1.5 text-xs font-semibold text-zinc-200">{plan}</Text>
        </View>
      ) : null}
    </View>
  </View>
);
