import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface WellnessRegisterCardProps {
  /** Ícono de la feature (Ionicons). */
  icon: IoniconName;
  /** Título de la acción (ej. "Sueño"). */
  title: string;
  /** Descripción corta (ej. "Duración y calidad"). */
  subtitle: string;
  /** Acción al tocar la card. */
  onPress?: () => void;
}

/**
 * Card del grid "Registrar" del módulo Bienestar (dark-only zinc, acento rose).
 * Tile de ícono + chevron arriba, título y subtítulo debajo. Pensada para una
 * grilla de 2 columnas (cada card ocupa la mitad del ancho).
 */
export function WellnessRegisterCard({
  icon,
  title,
  subtitle,
  onPress,
}: WellnessRegisterCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-4"
    >
      <View className="flex-row items-center justify-between">
        <IconTile name={icon} color="#fb7185" />
        <Ionicons name="chevron-forward" size={18} color="#71717a" />
      </View>

      <Text className="text-white text-base font-bold mt-3">{title}</Text>
      <Text className="text-zinc-400 text-xs mt-0.5">{subtitle}</Text>
    </TouchableOpacity>
  );
}
