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
  formatFullDate,
  formatSleepDuration,
  SLEEP_QUALITY_LABELS,
} from "@/src/utils/wellness.utils";

import { WellnessGroupCard } from "../WellnessGroupCard";
import { WellnessLogRow } from "../WellnessLogRow";
import { SleepLastLogCard } from "./SleepLastLogCard";
import { SleepRegisterCard } from "./SleepRegisterCard";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface SleepViewProps {
  logs: SleepLogDto[];
  lastLog: SleepLogDto | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onBack: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  /** Abre el formulario de nuevo registro (fase futura; mientras tanto, la card queda placeholder). */
  onRegister?: () => void;
  /** Abre el detalle de un registro del historial. */
  onSelectLog?: (log: SleepLogDto) => void;
}

/** Subtítulo "8 h · <calidad acentuada>" de una fila del historial. */
function SleepRowSubtitle({ log }: { log: SleepLogDto }) {
  return (
    <Text className="text-zinc-400 text-sm mt-0.5">
      {formatSleepDuration(log.durationMinutes)} ·{" "}
      <Text className="text-rose-400 font-semibold">
        {SLEEP_QUALITY_LABELS[log.quality]}
      </Text>
    </Text>
  );
}

/**
 * Vista de detalle de Sueño (`/health/sleep`). Header + card "Registrar sueño" +
 * "Último registro" + "Historial" paginado. Dark-only zinc, acento rose-400.
 * Mismo patrón que `ClinicalReadingsView` del módulo clínico.
 */
export function SleepView({
  logs,
  lastLog,
  hasMore,
  isLoading,
  isLoadingMore,
  error,
  onBack,
  onLoadMore,
  onRefresh,
  onRegister,
  onSelectLog,
}: SleepViewProps) {
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
        <Text className="text-white text-4xl font-bold">Sueño</Text>
        <Text className="text-zinc-400 mt-1">
          Registra cuánto dormiste y cómo fue tu descanso.
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
          <SleepRegisterCard onPress={onRegister} />

          {lastLog ? <SleepLastLogCard log={lastLog} /> : null}

          {/* Historial */}
          <View className="gap-3">
            <Text className="text-white text-2xl font-bold">Historial</Text>

            {logs.length > 0 ? (
              <>
                <WellnessGroupCard>
                  {logs.map((log) => (
                    <WellnessLogRow
                      key={log.id}
                      icon="calendar-outline"
                      title={formatFullDate(log.date)}
                      subtitle={<SleepRowSubtitle log={log} />}
                      note={log.note ?? undefined}
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
                <Ionicons name="moon-outline" size={28} color="#71717a" />
                <Text className="text-zinc-400 text-center mt-3">
                  Todavía no registraste tu sueño.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
