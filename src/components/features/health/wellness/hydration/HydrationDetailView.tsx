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
import { HydrationLogDto } from "@/src/types/wellness";
import {
  BEVERAGE_LABELS,
  formatCapturedTime,
  formatFullDate,
} from "@/src/utils/wellness.utils";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface HydrationDetailViewProps {
  log: HydrationLogDto;
  isDeleting: boolean;
  onBack: () => void;
  onDelete: () => void;
}

/** Fila etiqueta/valor de la card "Detalle" (valor acentuado opcional). */
function DetailRow({
  label,
  value,
  accent,
  isLast,
}: {
  label: string;
  value: string;
  accent?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        !isLast ? "border-b border-zinc-800" : ""
      }`}
    >
      <Text className="text-zinc-400 text-base">{label}</Text>
      <Text
        className={`text-lg font-semibold ${
          accent ? "text-rose-400" : "text-white"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Detalle de un registro de hidratación guardado (`/health/hydration-detail`).
 * Header + card de fecha/captura + card "Cantidad" (ml grande) + card "Detalle"
 * (tipo de bebida + fecha + hora) + acción "Eliminar registro".
 * Dark-only zinc, acento rose-400. Mismo patrón que `SleepDetailView`.
 */
export function HydrationDetailView({
  log,
  isDeleting,
  onBack,
  onDelete,
}: HydrationDetailViewProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 16;

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
        <Text className="text-white text-4xl font-bold">
          Detalle hidratación
        </Text>
        <Text className="text-zinc-400 mt-1">
          Registro guardado de una bebida.
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

        {/* Cantidad: ml grande y centrado */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
          <Text className="text-white text-xl font-bold">Cantidad</Text>
          <View className="items-center py-2">
            <View className="flex-row items-baseline">
              <Text className="text-rose-400 text-7xl font-bold">
                {log.amountMl}
              </Text>
              <Text className="text-rose-400 text-2xl font-semibold ml-2">
                ml
              </Text>
            </View>
          </View>
        </View>

        {/* Detalle: tipo de bebida + fecha + hora */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-1">
          <Text className="text-white text-xl font-bold pt-4 pb-1">
            Detalle
          </Text>
          <DetailRow
            label="Tipo de bebida"
            value={BEVERAGE_LABELS[log.beverageType]}
            accent
            isLast
          />
        </View>

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
