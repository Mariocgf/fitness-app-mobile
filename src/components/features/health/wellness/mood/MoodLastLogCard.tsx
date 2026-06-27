import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/components/common/SegmentedControl";
import { MoodLevel, MoodLogDto } from "@/src/types/wellness";
import {
  formatCapturedTime,
  formatFullDate,
  MOOD_LABELS,
  MOOD_LEVELS_ORDERED,
} from "@/src/utils/wellness.utils";

/** Opciones de la escala de ánimo (Muy mal → Muy bien), en el orden de la maqueta. */
const MOOD_OPTIONS: SegmentedOption<MoodLevel>[] = MOOD_LEVELS_ORDERED.map(
  (m) => ({ label: MOOD_LABELS[m], value: m }),
);

interface MoodLastLogCardProps {
  log: MoodLogDto;
}

/**
 * Card "Último registro" del detalle de Ánimo (dark-only zinc, acento rose-400).
 * Muestra el nivel en grande, la fecha/hora de captura, la nota (si existe) y la
 * escala de ánimo con el nivel registrado resaltado. La escala reutiliza
 * `SegmentedControl` en modo solo-lectura (`onChange` no-op): es la misma forma
 * visual que la maqueta sin duplicar el control.
 */
export function MoodLastLogCard({ log }: MoodLastLogCardProps) {
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <Text className="text-white text-2xl font-bold">Último registro</Text>

      {/* Nivel de ánimo (grande) */}
      <Text className="text-rose-400 text-5xl font-bold">
        {MOOD_LABELS[log.mood]}
      </Text>

      {/* Fecha + hora de captura */}
      <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color="#a1a1aa" />
          <Text className="text-zinc-400 text-sm">
            {formatFullDate(log.date)}
          </Text>
        </View>
        <Text className="text-zinc-600 text-sm">·</Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={15} color="#a1a1aa" />
          <Text className="text-zinc-400 text-sm">
            Registrado a las {formatCapturedTime(log.capturedAt)}
          </Text>
        </View>
      </View>

      {/* Nota (solo si existe) */}
      {log.note ? (
        <View className="flex-row items-start gap-2">
          <Ionicons
            name="chatbubble-outline"
            size={15}
            color="#a1a1aa"
            style={{ marginTop: 2 }}
          />
          <Text className="text-zinc-300 text-sm flex-1">{log.note}</Text>
        </View>
      ) : null}

      {/* Escala de ánimo (solo-lectura): el nivel registrado queda resaltado. */}
      <SegmentedControl
        options={MOOD_OPTIONS}
        value={log.mood}
        onChange={() => {}}
        accent="rose"
        variant="solid"
      />
    </View>
  );
}
