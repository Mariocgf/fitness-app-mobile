import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { EmptyTrainingHistory } from '@/src/components/features/training-history/EmptyTrainingHistory';
import { TrainingHistoryCardSkeleton } from '@/src/components/features/training-history/TrainingHistoryCardSkeleton';
import { TrainingHistoryFilters } from '@/src/components/features/training-history/TrainingHistoryFilters';
import { TrainingHistoryListCard } from '@/src/components/features/training-history/TrainingHistoryListCard';
import { useTrainingHistoryList } from '@/src/hooks/useTrainingHistoryList';
import { TrainingHistorySession } from '@/src/types/training-history';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Pantalla de lista paginada del historial de entrenamiento.
 * Permite filtrar por rango de fechas y navega al detalle de cada sesión.
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
    setDateRange,
    applyFilters,
    loadMore,
    refresh,
  } = useTrainingHistoryList(token);

  const [refreshing, setRefreshing] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const hasActiveFilters = !!(filters.fromDate || filters.toDate);

  const handleBack = useCallback(() => {
    router.push('/fitness');
  }, [router]);

  const handleToggleFilters = useCallback(() => {
    setIsFiltersExpanded((prev) => !prev);
  }, []);

  const handleScrollBegin = useCallback(() => {
    if (isFiltersExpanded) setIsFiltersExpanded(false);
  }, [isFiltersExpanded]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setDateRange(null, null);
    applyFilters();
  }, [setDateRange, applyFilters]);

  const handleCardPress = useCallback(
    (session: TrainingHistorySession) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push({ pathname: '/fitness/training-history/[id]' as any, params: { id: session.id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: TrainingHistorySession }) => (
      <TrainingHistoryListCard session={item} onPress={handleCardPress} />
    ),
    [handleCardPress],
  );

  const renderSeparator = useCallback(() => <View className="h-3" />, []);

  const renderFooter = useCallback(() => {
    if (sessions.length === 0) return null;
    if (isLoadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#a3e635" />
          <Text className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            Cargando más sesiones...
          </Text>
        </View>
      );
    }
    if (hasMore) {
      return (
        <View className="py-4 px-4">
          <TouchableOpacity
            onPress={loadMore}
            className="bg-lime-400 py-3 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-slate-900 font-semibold text-sm">Cargar más sesiones</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View className="py-6 items-center">
        <Text className="text-slate-400 dark:text-slate-500 text-sm">
          No hay más sesiones
        </Text>
      </View>
    );
  }, [hasMore, isLoadingMore, sessions.length, loadMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View className="px-4 pt-2">
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
        <View className="flex-1 items-center justify-center py-20 px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-slate-900 dark:text-slate-50 text-base font-medium mt-4 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={refresh}
            className="mt-4 bg-lime-400 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-slate-900 font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <EmptyTrainingHistory
        variant="list"
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />
    );
  }, [isLoading, error, refresh, hasActiveFilters, handleClearFilters]);

  const header = (
    <View style={{ paddingTop: insets.top }} className="px-4 pb-4">
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#64748b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-slate-50">
          Historial de entrenamiento
        </Text>
        <View className="w-10" />
      </View>
      {!isLoading && !error && sessions.length > 0 && (
        <View className="items-center mt-1">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <DarkSheetLayout header={header}>
        {/* Filtros */}
        <View className="px-4 pt-4 pb-2">
          <TrainingHistoryFilters
            dateRange={{ from: filters.fromDate, to: filters.toDate }}
            isExpanded={isFiltersExpanded}
            onToggle={handleToggleFilters}
            onDateRangeChange={(range) => setDateRange(range.from, range.to)}
            onApply={applyFilters}
            onClear={handleClearFilters}
          />
        </View>

        {/* Lista */}
        <FlatList
          data={isLoading ? [] : sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerClassName="px-4 pb-32"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#a3e635"
              colors={['#a3e635']}
            />
          }
        />
      </DarkSheetLayout>
    </SwipeBackWrapper>
  );
}
