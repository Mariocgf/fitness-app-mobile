import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface WellnessLogRowProps {
  /** Ícono de la feature (Ionicons). */
  icon: IoniconName;
  /** Título principal de la fila (ej. "Sueño"). */
  title: string;
  /**
   * Texto secundario bajo el título. Acepta `ReactNode` para permitir resaltar
   * partes con el acento del módulo (ej. "8 h · <Text rose>Buena</Text>").
   */
  subtitle: React.ReactNode;
  /** Tercera línea opcional, más tenue (ej. la nota del registro). */
  note?: string;
  /** Acción al tocar la fila. Si se omite, la fila no es interactiva. */
  onPress?: () => void;
  /** Muestra el chevron de la derecha. Default `true`; pasar `false` cuando la fila no navega a ningún detalle. */
  showChevron?: boolean;
}

/**
 * Fila reutilizable del módulo Bienestar: tile de ícono + título + subtítulo
 * (+ nota opcional) + chevron. La maqueta la repite en "Hoy", "Actividad
 * reciente" y el "Historial" de cada feature, así que se atomiza en vez de
 * copiar el bloque. Acento del módulo Salud: rose-400.
 */
export function WellnessLogRow({
  icon,
  title,
  subtitle,
  note,
  onPress,
  showChevron = true,
}: WellnessLogRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      className="flex-row items-center gap-4 py-3.5 px-1"
    >
      <IconTile name={icon} color="#fb7185" />

      <View className="flex-1">
        <Text className="text-white text-lg font-semibold">{title}</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">{subtitle}</Text>
        {note ? (
          <Text className="text-zinc-500 text-sm mt-0.5" numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>

      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color="#71717a" />
      ) : null}
    </TouchableOpacity>
  );
}
