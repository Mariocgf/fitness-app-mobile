import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

interface SleepRegisterCardProps {
  /**
   * Acción para abrir el formulario "Nuevo registro". Si se omite, la card queda
   * como placeholder deshabilitado (el form de registro es una fase futura).
   */
  onPress?: () => void;
}

/**
 * Card "Registrar sueño" del detalle de Sueño (dark-only zinc, acento rose-400).
 * Tile de luna + título/subtítulo + enlace "Nuevo registro →". Mismo patrón que
 * `RegisterReadingCard` del módulo clínico.
 */
export function SleepRegisterCard({ onPress }: SleepRegisterCardProps) {
  const disabled = !onPress;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <IconTile name="moon" color="#fb7185" size={56} />

      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Registrar sueño</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">
          Duración, calidad y nota opcional.
        </Text>
      </View>

      <View className="flex-row items-center gap-1 shrink-0">
        <Text className="text-rose-400 font-semibold text-sm">
          Nuevo registro
        </Text>
        <Ionicons name="arrow-forward" size={16} color="#fb7185" />
      </View>
    </TouchableOpacity>
  );
}
