import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

interface HydrationRegisterCardProps {
  /**
   * Acción para abrir el formulario "Nuevo registro". Si se omite, la card queda
   * como placeholder deshabilitado (el form de registro es una fase futura).
   */
  onPress?: () => void;
}

/**
 * Card "Registrar hidratación" del detalle de Hidratación (dark-only zinc, acento
 * rose-400). Tile de gota + título/subtítulo + enlace "Nuevo registro →". Mismo
 * patrón que `SleepRegisterCard`.
 */
export function HydrationRegisterCard({ onPress }: HydrationRegisterCardProps) {
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
      <IconTile name="water" color="#fb7185" size={56} />

      <View className="flex-1">
        <Text className="text-white text-lg font-bold">
          Registrar hidratación
        </Text>
        <Text className="text-zinc-400 text-sm mt-0.5">
          Cantidad y tipo de bebida.
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
