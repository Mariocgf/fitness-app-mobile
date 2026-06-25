import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { ClinicalReadingDto } from "@/src/types/clinical";

import { ClinicalReadingHistoryCard } from "./ClinicalReadingHistoryCard";
import { RegisterReadingCard } from "./RegisterReadingCard";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

interface ClinicalReadingsViewProps {
  readings: ClinicalReadingDto[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onBack: () => void;
  onRegister: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
}

/**
 * Vista "Lecturas clínicas" (`/health/clinical-readings`). Header + card "Registrar lectura"
 * (reusada) + historial paginado de lecturas. Dark-only zinc, acento rose-400.
 */
export function ClinicalReadingsView({
  readings,
  hasMore,
  isLoading,
  isLoadingMore,
  error,
  onBack,
  onRegister,
  onLoadMore,
  onRefresh,
}: ClinicalReadingsViewProps) {
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
        <Text className="text-white text-4xl font-bold">Lecturas clínicas</Text>
        <Text className="text-zinc-400 mt-1">
          Registrá y consultá tus valores clínicos en el tiempo.
        </Text>
      </View>

      {isLoading && readings.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ROSE} />
        </View>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: bottomOffset,
            gap: 12,
          }}
          ListHeaderComponent={
            <View className="gap-4 mb-2">
              <RegisterReadingCard onPress={onRegister} />
              {readings.length > 0 && (
                <Text className="text-white text-xl font-bold mt-2">
                  Historial
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ClinicalReadingHistoryCard reading={item} />
          )}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.3}
          onRefresh={onRefresh}
          refreshing={isLoading}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={ROSE} />
              </View>
            ) : error ? (
              <TouchableOpacity
                onPress={onLoadMore}
                activeOpacity={0.8}
                className="py-4 items-center"
              >
                <Text className="text-rose-400 text-sm text-center">
                  {error}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 gap-3">
              <Ionicons name="pulse-outline" size={44} color="#52525b" />
              <Text className="text-zinc-400 text-center">
                Todavía no registraste lecturas clínicas.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
