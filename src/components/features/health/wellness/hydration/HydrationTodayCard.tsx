import React from "react";
import { Text, View } from "react-native";

import { HydrationLogDto } from "@/src/types/wellness";
import { BEVERAGE_LABELS } from "@/src/utils/wellness.utils";

interface HydrationTodayCardProps {
  /** Suma de ml registrados hoy. */
  todayMl: number;
  /** Último registro (para la línea "Último registro: 500 ml · Agua"), o null. */
  lastLog: HydrationLogDto | null;
}

/**
 * Card "Hoy" del detalle de Hidratación (dark-only zinc, acento rose-400).
 * Muestra el total de ml de hoy en grande y, si existe, el último registro
 * (cantidad + tipo de bebida acentuado). Mismo molde que `SleepLastLogCard`.
 */
export function HydrationTodayCard({
  todayMl,
  lastLog,
}: HydrationTodayCardProps) {
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-3">
      <Text className="text-white text-2xl font-bold">Hoy</Text>

      {/* Total de ml de hoy (grande) */}
      <View className="flex-row items-baseline">
        <Text className="text-rose-400 text-7xl font-bold">{todayMl}</Text>
        <Text className="text-rose-400 text-2xl font-semibold ml-2">ml</Text>
      </View>

      {/* Último registro (solo si hay alguno) */}
      {lastLog ? (
        <Text className="text-zinc-400 text-base">
          Último registro: {lastLog.amountMl} ml ·{" "}
          <Text className="text-rose-400 font-semibold">
            {BEVERAGE_LABELS[lastLog.beverageType]}
          </Text>
        </Text>
      ) : (
        <Text className="text-zinc-500 text-base">Sin registros hoy.</Text>
      )}
    </View>
  );
}
