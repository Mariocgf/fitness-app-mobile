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

import { WellnessGroupCard } from "../WellnessGroupCard";
import { WellnessLogRow } from "../WellnessLogRow";
import { HydrationRegisterCard } from "./HydrationRegisterCard";
import { HydrationTodayCard } from "./HydrationTodayCard";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface HydrationViewProps {
  logs: HydrationLogDto[];
  lastLog: HydrationLogDto | null;
  todayMl: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onBack: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  /** Abre el formulario de nuevo registro (fase futura; mientras tanto, la card queda placeholder). */
  onRegister?: () => void;
  /** Abre el detalle de un registro del historial (fase futura). */
  onSelectLog?: (log: HydrationLogDto) => void;
}

/** Subtítulo "500 ml · <bebida acentuada>" de una fila del historial. */
function HydrationRowSubtitle({ log }: { log: HydrationLogDto }) {
  return (
    <Text className="text-zinc-400 text-sm mt-0.5">
      {log.amountMl} ml ·{" "}
      <Text className="text-rose-400 font-semibold">
        {BEVERAGE_LABELS[log.beverageType]}
      </Text>
    </Text>
  );
}

/**
 * Vista de detalle de Hidratación (`/health/hydration`). Header + card "Registrar
 * hidratación" + "Hoy" (total de ml + último registro) + "Historial" paginado.
 * Dark-only zinc, acento rose-400. Mismo patrón que `SleepView`.
 */
export function HydrationView({
  logs,
  lastLog,
  todayMl,
  hasMore,
  isLoading,
  isLoadingMore,
  error,
  onBack,
  onLoadMore,
  onRefresh,
  onRegister,
  onSelectLog,
}: HydrationViewProps) {
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
        <Text className="text-white text-4xl font-bold">Hidratación</Text>
        <Text className="text-zinc-400 mt-1">
          Registra las bebidas que consumes durante el día.
        </Text>
      </View>

      {isLoading && logs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ROSE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: bottomOffset,
            gap: 24,
          }}
        >
          <HydrationRegisterCard onPress={onRegister} />

          <HydrationTodayCard todayMl={todayMl} lastLog={lastLog} />

          {/* Historial */}
          <View className="gap-3">
            <Text className="text-white text-2xl font-bold">Historial</Text>

            {logs.length > 0 ? (
              <>
                <WellnessGroupCard>
                  {logs.map((log) => (
                    <WellnessLogRow
                      key={log.id}
                      icon="water-outline"
                      title={formatFullDate(log.date)}
                      subtitle={<HydrationRowSubtitle log={log} />}
                      note={formatCapturedTime(log.capturedAt)}
                      onPress={
                        onSelectLog ? () => onSelectLog(log) : undefined
                      }
                      showChevron={!!onSelectLog}
                    />
                  ))}
                </WellnessGroupCard>

                {hasMore ? (
                  <TouchableOpacity
                    onPress={onLoadMore}
                    disabled={isLoadingMore}
                    activeOpacity={0.8}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 items-center"
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator size="small" color={ROSE} />
                    ) : (
                      <Text className="text-rose-400 font-semibold">
                        Ver más registros
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}

                {error ? (
                  <Text className="text-rose-400 text-sm text-center">
                    {error}
                  </Text>
                ) : null}
              </>
            ) : (
              <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 items-center">
                <Ionicons name="water-outline" size={28} color="#71717a" />
                <Text className="text-zinc-400 text-center mt-3">
                  Todavía no registraste hidratación.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
