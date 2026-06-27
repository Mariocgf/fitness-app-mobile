import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

interface WellnessEntryCardProps {
  onPress: () => void;
}

/**
 * Card del dashboard de Salud que da acceso al módulo Bienestar (sueño,
 * hidratación, ánimo y meditación). Mismo patrón que `ClinicalReadingsEntryCard`.
 */
export function WellnessEntryCard({ onPress }: WellnessEntryCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4"
    >
      <IconTile name="sparkles" color="#fb7185" />

      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Bienestar</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">
          Sueño, hidratación, ánimo y meditación.
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#71717a" />
    </TouchableOpacity>
  );
}
