import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Color neutro del ícono del tile (zinc-300). Perfil no tiene acento de módulo. */
const ICON_COLOR = '#d4d4d8';

interface ProfileModuleCardProps {
  /** Ícono del tile (Ionicons) */
  icon: IoniconName;
  /** Título principal de la card (ej. "Fitness", "Suscripción") */
  title: string;
  /** Texto secundario en una línea (ej. "Plan Premium activo"). Excluyente con `bullets` */
  subtitle?: string;
  /** Lista de sub-secciones a mostrar como bullets. Excluyente con `subtitle` */
  bullets?: string[];
  /** Acción al tocar la card */
  onPress: () => void;
}

/**
 * Card de navegación del Perfil (dark-only `zinc` neutro, sin acento de módulo).
 * Cubre las dos formas de la maqueta: fila con subtítulo (Suscripción/Configuración)
 * y card de módulo con bullets de sus sub-secciones (Fitness/Nutrición/Salud).
 * Reutiliza el átomo `IconTile`. Los bullets deben ser sub-secciones REALES, no
 * inventadas (ver `agent-implementation-lessons.md`).
 */
export const ProfileModuleCard: React.FC<ProfileModuleCardProps> = ({
  icon,
  title,
  subtitle,
  bullets,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center mx-5 mb-3 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800"
  >
    <IconTile name={icon} color={ICON_COLOR} iconSize={26} size={52} />

    <View className="flex-1 ml-4">
      <Text className="text-lg font-semibold text-white">{title}</Text>

      {subtitle ? <Text className="text-sm text-zinc-500 mt-0.5">{subtitle}</Text> : null}

      {bullets && bullets.length > 0 ? (
        <View className="mt-1.5">
          {bullets.map((item) => (
            <View key={item} className="flex-row items-center mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-2.5" />
              <Text className="text-sm text-zinc-400">{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>

    <Ionicons name="chevron-forward" size={20} color="#52525b" />
  </TouchableOpacity>
);
