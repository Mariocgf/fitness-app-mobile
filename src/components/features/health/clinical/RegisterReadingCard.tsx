import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface RegisterReadingCardProps {
  onPress: () => void;
}

/**
 * Card "Registrar lectura" reutilizable: lleva al formulario de registro de lectura.
 * Se usa en el dashboard de Salud (bloque clínico) y en el tope de la vista de Lecturas clínicas.
 */
export function RegisterReadingCard({ onPress }: RegisterReadingCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4"
    >
      {/* Tile circular con "+" */}
      <View className="w-14 h-14 rounded-full border border-zinc-700 items-center justify-center">
        <Ionicons name="add" size={28} color="#fb7185" />
      </View>

      {/* Título + subtítulo */}
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Registrar lectura</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">
          Agregá glucosa, colesterol o lípidos cuando quieras.
        </Text>
      </View>

      {/* Enlace "Nueva lectura →" */}
      <View className="flex-row items-center gap-1 shrink-0">
        <Text className="text-rose-400 font-semibold text-sm">Nueva lectura</Text>
        <Ionicons name="arrow-forward" size={16} color="#fb7185" />
      </View>
    </TouchableOpacity>
  );
}
