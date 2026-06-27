import React from "react";
import { Text, View } from "react-native";

interface WellnessGroupCardProps {
  /** Título opcional dentro de la card (ej. "Hoy"). */
  title?: string;
  /** Filas a renderizar; se insertan divisores entre ellas automáticamente. */
  children: React.ReactNode;
}

/**
 * Card contenedora del módulo Bienestar (dark-only zinc). Envuelve un grupo de
 * `WellnessLogRow` con un título opcional y divisores entre filas. La usan tanto
 * "Hoy" (con título) como "Actividad reciente" (sin título, el header va fuera).
 */
export function WellnessGroupCard({ title, children }: WellnessGroupCardProps) {
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-4 py-1">
      {title ? (
        <Text className="text-white text-2xl font-bold px-1 pt-3 pb-1">
          {title}
        </Text>
      ) : null}

      {rows.map((row, index) => (
        <View key={index}>
          {index > 0 ? <View className="h-px bg-zinc-800 ml-16" /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}
