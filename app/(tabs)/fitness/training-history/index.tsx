import { SelectablePill } from '@/src/components/common/SelectablePill';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { SwipeableTrainingHistoryCard } from '@/src/components/features/training-history/SwipeableTrainingHistoryCard';
import { TrainingHistoryCardSkeleton } from '@/src/components/features/training-history/TrainingHistoryCardSkeleton';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useTrainingHistoryList } from '@/src/hooks/useTrainingHistoryList';
import { TrainingHistorySession } from '@/src/types/training-history';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIME = '#a3e635';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
type DatePreset = 'all' | 'today' | 'week' | 'month';

/**
 * Pantalla "Historial": lista paginada del historial de entrenamiento (dark-only
 * `zinc`, acento `lime-400`). Rediseñada desde la maqueta de "Mis rutinas". No hay
 * filtro por source (todas las sesiones son iguales), solo filtro por fecha con
 * `SelectablePill`. Cada card navega al detalle y se puede eliminar con swipe.
 */
export default function TrainingHistoryScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const {
    sessions,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    filters,
    applyDateRange,
    loadMore,
    refresh,
    deleteSession,
  } = useTrainingHistoryList(token);

  const [refreshing, setRefreshing] = useState(false);

  const hasActiveFilters = !!(filters.fromDate || filters.toDate);

  /* ── Preset de fecha derivado del rango activo ────────────────────────── */
  const activeDatePreset: DatePreset = useMemo(() => {
    const fromMs = filters.fromDate?.getTime();
    if (!fromMs) return 'all';
    const now = Date.now();
    if (Math.abs(fromMs - (now - DAY_MS)) < 60_000) return 'today';
    if (Math.abs(fromMs - (now - WEEK_MS)) < 60_000) return 'week';
    if (Math.abs(fromMs - (now - MONTH_MS)) < 60_000) return 'month';
    return 'all';
  }, [filters.fromDate]);

  const setDatePreset = useCallback((preset: DatePreset) => {
    const now = Date.now();
    if (preset === 'today') applyDateRange(new Date(now - DAY_MS), new Date());
    else if (preset === 'week') applyDateRange(new Date(now - WEEK_MS), new Date());
    else if (preset === 'month') applyDateRange(new Date(now - MONTH_MS), new Date());
    else applyDateRange(null, null);
  }, [applyDateRange]);

  const handleBack = useCallback(() => {
    router.push('/fitness');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    applyDateRange(null, null);
  }, [applyDateRange]);

  const handleCardPress = useCallback(
    (session: TrainingHistorySession) => {
      router.push({ pathname: '/fitness/training-history/[id]' as any, params: { id: session.id } });
    },
    [router],
  );

  const handleDeleteRequest = useCallback(
    (session: TrainingHistorySession) => {
      Alert.alert(
        '¿Eliminar sesión?',
        `¿Estás seguro de que quieres eliminar la sesión "${session.routineName}" del ${session.trainedAt.toLocaleDateString()}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSession(session.id);
              } catch (err) {
                Alert.alert(
                  'Error',
                  err instanceof Error ? err.message : 'No se pudo eliminar la sesión',
                );
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [deleteSession],
  );

  const renderItem = useCallback(
    ({ item }: { item: TrainingHistorySession }) => (
      <SwipeableTrainingHistoryCard
        session={item}
        onPress={handleCardPress}
        onDelete={handleDeleteRequest}
      />
    ),
    [handleCardPress, handleDeleteRequest],
  );

  const renderSeparator = useCallback(() => <View className="h-3" />, []);

  const renderFooter = useCallback(() => {
    if (sessions.length === 0) return null;

    if (isLoadingMore) {
      return (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color={LIME} />
        </View>
      );
    }

    if (hasMore) {
      return (
        <TouchableOpacity
          onPress={loadMore}
          activeOpacity={0.7}
          className="flex-row items-center justify-center mt-4 py-2"
        >
          <Text className="text-lime-400 text-sm font-semibold mr-1.5">Ver más sesiones</Text>
          <Ionicons name="arrow-down" size={16} color={LIME} />
        </TouchableOpacity>
      );
    }

    return null;
  }, [hasMore, isLoadingMore, sessions.length, loadMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View className="pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} className="mb-3">
              <TrainingHistoryCardSkeleton variant="list" />
            </View>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View className="items-center justify-center py-20 px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white text-base font-medium mt-4 text-center">{error}</Text>
          <TouchableOpacity
            onPress={refresh}
            className="mt-4 bg-lime-400 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-zinc-900 font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="items-center justify-center py-20 px-6">
        <Ionicons name="barbell-outline" size={48} color="#52525b" />
        <Text className="text-white text-base font-medium mt-4 text-center">
          {hasActiveFilters ? 'No hay sesiones con esos filtros' : 'Todavía no hay sesiones registradas'}
        </Text>
        <Text className="text-zinc-500 text-sm mt-2 text-center">
          {hasActiveFilters
            ? 'Probá ajustando el rango de fechas'
            : 'Completá un entrenamiento para ver tu historial acá'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={handleClearFilters}
            className="mt-4 bg-zinc-800 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, error, refresh, hasActiveFilters, handleClearFilters]);

  const listHeader = (
    <View className="pb-1">
      {/* Back */}
      <View className="flex-row items-center py-2">
        <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Título + conteo */}
      <Text className="text-3xl font-bold text-white">Historial</Text>
      <Text className="text-zinc-500 text-sm mt-1 mb-5">
        {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
      </Text>

      {/* Filtro de fecha */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <SelectablePill label="Todas" selected={activeDatePreset === 'all'} onPress={() => setDatePreset('all')} accent="lime" />
        <SelectablePill label="Hoy" selected={activeDatePreset === 'today'} onPress={() => setDatePreset('today')} accent="lime" />
        <SelectablePill label="Última semana" selected={activeDatePreset === 'week'} onPress={() => setDatePreset('week')} accent="lime" />
        <SelectablePill label="Último mes" selected={activeDatePreset === 'month'} onPress={() => setDatePreset('month')} accent="lime" />
      </View>
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        <FlatList
          data={isLoading ? [] : sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={LIME}
              colors={[LIME]}
            />
          }
        />
      </View>
    </SwipeBackWrapper>
  );
}
