import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

interface ClinicalReadingsEntryCardProps {
  totalCount: number;
  onPress: () => void;
}

/**
 * Card del dashboard de Salud (3ª del bloque clínico) que da acceso al historial
 * de Lecturas clínicas (vista 3).
 */
export function ClinicalReadingsEntryCard({
  totalCount,
  onPress,
}: ClinicalReadingsEntryCardProps) {
  const subtitle =
    totalCount > 0
      ? `${totalCount} lectura${totalCount !== 1 ? "s" : ""} registrada${
          totalCount !== 1 ? "s" : ""
        }`
      : "Consultá tus valores en el tiempo.";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4"
    >
      <IconTile name="pulse-outline" color="#fb7185" />

      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Lecturas clínicas</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#71717a" />
    </TouchableOpacity>
  );
}
