import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { SleepLogDto } from "@/src/types/wellness";
import {
  formatCapturedTime,
  formatFullDate,
  SLEEP_QUALITY_LABELS,
} from "@/src/utils/wellness.utils";

interface SleepLastLogCardProps {
  log: SleepLogDto;
}

/**
 * Card "Último registro" del detalle de Sueño (dark-only zinc, acento rose-400).
 * Muestra la duración en grande + calidad, la fecha/hora de captura y, si existe,
 * la nota. Divide duración y calidad con una línea vertical (como la maqueta).
 */
export function SleepLastLogCard({ log }: SleepLastLogCardProps) {
  const hours = Math.floor(log.durationMinutes / 60);
  const minutes = log.durationMinutes % 60;

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <Text className="text-white text-2xl font-bold">Último registro</Text>

      {/* Duración (grande) | Calidad */}
      <View className="flex-row items-center gap-5">
        <View className="flex-row items-baseline">
          <Text className="text-rose-400 text-6xl font-bold">{hours}</Text>
          <Text className="text-rose-400 text-2xl font-semibold ml-1">h</Text>
          {minutes > 0 ? (
            <>
              <Text className="text-rose-400 text-4xl font-bold ml-2">
                {minutes}
              </Text>
              <Text className="text-rose-400 text-xl font-semibold ml-1">
                min
              </Text>
            </>
          ) : null}
        </View>

        <View className="w-px h-12 bg-zinc-700" />

        <Text className="text-rose-400 text-3xl font-bold flex-1">
          {SLEEP_QUALITY_LABELS[log.quality]}
        </Text>
      </View>

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
        <View className="border-t border-zinc-800 pt-4 flex-row items-start gap-2">
          <Ionicons
            name="chatbubble-outline"
            size={15}
            color="#a1a1aa"
            style={{ marginTop: 2 }}
          />
          <Text className="text-zinc-300 text-sm flex-1">{log.note}</Text>
        </View>
      ) : null}
    </View>
  );
}
