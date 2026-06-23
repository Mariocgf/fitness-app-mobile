import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { SelectablePill } from '@/src/components/common/SelectablePill';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { RoutineListCard } from '@/src/components/features/routine/RoutineListCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useRoutinesScreen } from '@/src/hooks/useRoutinesScreen';
import { RoutineSource, RoutineSummary } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const LIME = '#a3e635';

/**
 * Vista "Mis rutinas": biblioteca completa de rutinas del usuario (dark-only `zinc`,
 * acento `lime-400`). Rediseñada desde la maqueta. Filtro de source con
 * `SegmentedControl` (Todas/IA/Manual) y filtro de fecha desplegable con
 * `SelectablePill`. La rutina activa se ordena primero como card destacada.
 * La lógica vive en `useRoutinesScreen`.
 */
export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const {
    routines,
    sortedRoutines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    sourceFilter,
    setSourceFilter,
    loadMore,
    refresh,
    refreshing,
    showDateFilter,
    setShowDateFilter,
    activeDatePreset,
    hasDateFilter,
    setDatePreset,
    selectedRoutine,
    selectedRoutineSummary,
    isLoadingRoutine,
    handleBack,
    handleCreate,
    handleCloseDetail,
    handleDeleteRoutine,
    handleActivateRoutine,
    handleRegenerate,
    handleRoutineUpdated,
    handleRoutinePress,
    handleRefresh,
    handleClearFilters,
  } = useRoutinesScreen();

  const renderRoutineCard = useCallback(
    ({ item }: { item: RoutineSummary }) => (
      <RoutineListCard routine={item} onPress={handleRoutinePress} />
    ),
    [handleRoutinePress],
  );

  const renderSeparator = useCallback(() => <View className="h-3" />, []);

  const renderFooter = useCallback(() => {
    if (routines.length === 0) return null;

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
          <Text className="text-lime-400 text-sm font-semibold mr-1.5">Ver más rutinas</Text>
          <Ionicons name="arrow-down" size={16} color={LIME} />
        </TouchableOpacity>
      );
    }

    return null;
  }, [hasMore, isLoadingMore, routines.length, loadMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color={LIME} />
          <Text className="text-zinc-400 text-sm mt-4">Cargando rutinas...</Text>
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

    const filtersActive = sourceFilter !== 'all' || hasDateFilter;
    return (
      <View className="items-center justify-center py-20 px-6">
        <Ionicons name="barbell-outline" size={48} color="#52525b" />
        <Text className="text-white text-base font-medium mt-4 text-center">
          No se encontraron rutinas
        </Text>
        <Text className="text-zinc-500 text-sm mt-2 text-center">
          {filtersActive ? 'Probá ajustando los filtros' : 'Creá tu primera rutina'}
        </Text>
        {filtersActive && (
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
  }, [isLoading, error, refresh, sourceFilter, hasDateFilter, handleClearFilters]);

  const listHeader = (
    <View className="pb-1">
      {/* Back */}
      <View className="flex-row items-center py-2">
        <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Título + conteo */}
      <Text className="text-3xl font-bold text-white">Mis rutinas</Text>
      <Text className="text-zinc-500 text-sm mt-1 mb-5">
        {routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'}
      </Text>

      {/* Filtro de source + botón de fecha */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1">
          <SegmentedControl
            options={[
              { label: 'Todas', value: 'all' },
              { label: 'IA', value: 'AI' },
              { label: 'Manual', value: 'Manual' },
            ]}
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as 'all' | RoutineSource)}
            accent="lime"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowDateFilter((v) => !v)}
          activeOpacity={0.7}
          className={`w-12 h-12 rounded-xl items-center justify-center border ${
            hasDateFilter ? 'bg-lime-400/15 border-lime-400' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <Ionicons name="calendar-outline" size={20} color={hasDateFilter ? LIME : '#a1a1aa'} />
        </TouchableOpacity>
      </View>

      {/* Pills de fecha desplegables */}
      {showDateFilter && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          <SelectablePill label="Cualquier fecha" selected={activeDatePreset === 'all'} onPress={() => setDatePreset('all')} accent="lime" />
          <SelectablePill label="Última semana" selected={activeDatePreset === 'week'} onPress={() => setDatePreset('week')} accent="lime" />
          <SelectablePill label="Último mes" selected={activeDatePreset === 'month'} onPress={() => setDatePreset('month')} accent="lime" />
        </View>
      )}
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        <FlatList
          data={sortedRoutines}
          renderItem={renderRoutineCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 88,
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

        {/* CTA flotante "Crear rutina" (sobre el tab bar nativo) */}
        <View
          style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
        >
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.85}
            className="flex-row items-center justify-center bg-lime-400 rounded-2xl py-4"
          >
            <Ionicons name="add-circle-outline" size={22} color="#18181b" />
            <Text className="text-zinc-900 font-bold text-base ml-2">Crear rutina</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detalle de rutina */}
      {selectedRoutine && (
        <RoutineDetailView
          routine={selectedRoutine}
          onClose={handleCloseDetail}
          cardLayout={{
            x: SCREEN_WIDTH * 0.2,
            y: SCREEN_HEIGHT * 0.3,
            width: SCREEN_WIDTH * 0.6,
            height: 200,
          }}
          readOnly={!selectedRoutine.isActive}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
          onActivate={!selectedRoutine.isActive ? () => handleActivateRoutine(selectedRoutine) : undefined}
          onDelete={handleDeleteRoutine}
        />
      )}

      {/* Loading mientras se carga la rutina */}
      {isLoadingRoutine && selectedRoutineSummary && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color={LIME} />
            <Text className="text-white mt-4 font-medium">Cargando rutina...</Text>
          </View>
        </View>
      )}
    </SwipeBackWrapper>
  );
}
