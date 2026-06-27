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
import { MoodLogDto } from "@/src/types/wellness";
import { formatFullDate, MOOD_LABELS } from "@/src/utils/wellness.utils";

import { WellnessGroupCard } from "../WellnessGroupCard";
import { WellnessLogRow } from "../WellnessLogRow";
import { MoodLastLogCard } from "./MoodLastLogCard";
import { MoodRegisterCard } from "./MoodRegisterCard";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface MoodViewProps {
  logs: MoodLogDto[];
  lastLog: MoodLogDto | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onBack: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  /** Abre el formulario de nuevo registro. */
  onRegister?: () => void;
  /** Abre el detalle de un registro del historial. */
  onSelectLog?: (log: MoodLogDto) => void;
}

/** Subtítulo "<nivel acentuado>" de una fila del historial. */
function MoodRowSubtitle({ log }: { log: MoodLogDto }) {
  return (
    <Text className="text-rose-400 text-sm font-semibold mt-0.5">
      {MOOD_LABELS[log.mood]}
    </Text>
  );
}

/**
 * Vista de detalle de Ánimo (`/health/mood`). Header + card "Registrar ánimo" +
 * "Último registro" + "Historial" paginado. Dark-only zinc, acento rose-400.
 * Espejo de `SleepView`.
 */
export function MoodView({
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
}: MoodViewProps) {
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
        <Text className="text-white text-4xl font-bold">Ánimo</Text>
        <Text className="text-zinc-400 mt-1">
          Registra cómo te sientes durante el día.
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
          <MoodRegisterCard onPress={onRegister} />

          {lastLog ? <MoodLastLogCard log={lastLog} /> : null}

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
                      subtitle={<MoodRowSubtitle log={log} />}
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
                <Ionicons name="happy-outline" size={28} color="#71717a" />
                <Text className="text-zinc-400 text-center mt-3">
                  Todavía no registraste tu ánimo.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
