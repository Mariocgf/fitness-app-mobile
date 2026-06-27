import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { SleepLogDto } from "@/src/types/wellness";
import {
  formatCapturedTime,
  formatFullDate,
  SLEEP_QUALITY_LABELS,
} from "@/src/utils/wellness.utils";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface SleepDetailViewProps {
  log: SleepLogDto;
  isDeleting: boolean;
  onBack: () => void;
  onDelete: () => void;
}

/**
 * Detalle de un registro de sueño guardado (`/health/sleep-detail`).
 * Header + card de fecha/captura + card "Descanso" (duración grande + calidad) +
 * card "Nota" (si existe) + acción "Eliminar registro". Dark-only zinc, acento rose-400.
 * Nota: la maqueta mostraba la duración duplicada en minutos ("480 min"); se omite
 * a pedido del usuario y la card se balancea solo con horas (+ minutos si los hay).
 */
export function SleepDetailView({
  log,
  isDeleting,
  onBack,
  onDelete,
}: SleepDetailViewProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 16;

  const hours = Math.floor(log.durationMinutes / 60);
  const minutes = log.durationMinutes % 60;

  return (
    <View className="flex-1">
      {/* Header: back circular + título grande + subtítulo */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={onBack}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mb-4"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-4xl font-bold">Detalle de sueño</Text>
        <Text className="text-zinc-400 mt-1">
          Registro guardado de tu descanso.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: bottomOffset,
          gap: 16,
        }}
      >
        {/* Fecha + hora de captura */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-full border border-zinc-700 items-center justify-center">
            <Ionicons name="calendar-outline" size={24} color={ROSE} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              {formatFullDate(log.date)}
            </Text>
            <Text className="text-zinc-400 text-sm mt-0.5">
              Registrado a las {formatCapturedTime(log.capturedAt)}
            </Text>
          </View>
        </View>

        {/* Descanso: duración (grande) + calidad */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
          <Text className="text-white text-xl font-bold">Descanso</Text>

          <View className="items-center py-2">
            <View className="flex-row items-baseline">
              <Text className="text-rose-400 text-7xl font-bold">{hours}</Text>
              <Text className="text-rose-400 text-2xl font-semibold ml-1">
                h
              </Text>
              {minutes > 0 ? (
                <>
                  <Text className="text-rose-400 text-5xl font-bold ml-3">
                    {minutes}
                  </Text>
                  <Text className="text-rose-400 text-xl font-semibold ml-1">
                    min
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <View className="border-t border-zinc-800 pt-4 flex-row items-center justify-between">
            <Text className="text-zinc-400 text-base">Calidad</Text>
            <Text className="text-rose-400 text-lg font-bold">
              {SLEEP_QUALITY_LABELS[log.quality]}
            </Text>
          </View>
        </View>

        {/* Nota (solo si existe) */}
        {log.note ? (
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-2">
            <Text className="text-white text-xl font-bold">Nota</Text>
            <Text className="text-zinc-300 text-base">{log.note}</Text>
          </View>
        ) : null}

        {/* Eliminar registro */}
        <TouchableOpacity
          onPress={onDelete}
          disabled={isDeleting}
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-2 py-4 mt-2"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#f87171" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#f87171" />
              <Text className="text-red-400 text-base font-semibold">
                Eliminar registro
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
