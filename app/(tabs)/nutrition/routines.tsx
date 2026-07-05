import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { NutritionRoutineListCard } from '@/src/components/features/nutrition/NutritionRoutineListCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useMyNutritionRoutines } from '@/src/hooks/useMyNutritionRoutines';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import { NutritionRoutineSummaryDto } from '@/src/types/nutritionRoutine';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AMBER = '#fbbf24';

/**
 * Vista "Mis planes": listado completo de rutinas alimenticias del usuario
 * (dark-only `zinc`, acento `amber-400`). Ruta pusheada desde el tab Plan.
 * Espeja la biblioteca "Mis rutinas" de Fitness, pero sin filtro de source/fecha
 * (nutrición no tiene esa dimensión). El backend ordena la activa primero.
 *
 * - Tocar una card → detalle del plan completo (`/nutrition/routine/[id]`).
 * - "Generar plan" → dispara la generación y vuelve al tab Plan para revisar el draft.
 */
export default function NutritionRoutinesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { generate } = useNutritionRoutineContext();

  const [refreshing, setRefreshing] = useState(false);

  const { routines, isLoading, isLoadingMore, error, hasMore, refresh, loadMore } =
    useMyNutritionRoutines();

  const handleBack = useCallback(() => router.back(), [router]);

  const handleRoutinePress = useCallback(
    (routine: NutritionRoutineSummaryDto) => {
      router.push({
        pathname: '/nutrition/routine/[id]' as any,
        params: { id: routine.id, name: routine.name },
      });
    },
    [router],
  );

  /** Genera un plan nuevo y vuelve al tab Plan para revisar/aceptar el draft. */
  const handleGenerate = useCallback(() => {
    generate();
    router.back();
  }, [generate, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderRoutineCard = useCallback(
    ({ item }: { item: NutritionRoutineSummaryDto }) => (
      <NutritionRoutineListCard routine={item} onPress={handleRoutinePress} />
    ),
    [handleRoutinePress],
  );

  const renderSeparator = useCallback(() => <View className="h-3" />, []);

  const renderFooter = useCallback(() => {
    if (routines.length === 0) return null;

    if (isLoadingMore) {
      return (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color={AMBER} />
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
          <Text className="text-amber-400 text-sm font-semibold mr-1.5">Ver más planes</Text>
          <Ionicons name="arrow-down" size={16} color={AMBER} />
        </TouchableOpacity>
      );
    }

    return null;
  }, [hasMore, isLoadingMore, routines.length, loadMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color={AMBER} />
          <Text className="text-zinc-400 text-sm mt-4">Cargando planes...</Text>
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
            className="mt-4 bg-amber-400 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-zinc-900 font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="items-center justify-center py-20 px-6">
        <Ionicons name="restaurant-outline" size={48} color="#52525b" />
        <Text className="text-white text-base font-medium mt-4 text-center">
          Todavía no tenés planes
        </Text>
        <Text className="text-zinc-500 text-sm mt-2 text-center">
          Generá tu primer plan nutricional con IA
        </Text>
      </View>
    );
  }, [isLoading, error, refresh]);

  const listHeader = (
    <View className="pb-1">
      <View className="flex-row items-center py-2">
        <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      <Text className="text-3xl font-bold text-white">Mis planes</Text>
      <Text className="text-zinc-500 text-sm mt-1 mb-5">
        {routines.length} {routines.length === 1 ? 'plan' : 'planes'}
      </Text>
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        <FlatList
          data={routines}
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
              tintColor={AMBER}
              colors={[AMBER]}
            />
          }
        />

        {/* CTA flotante "Generar plan" (sobre el tab bar nativo) */}
        <View
          style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
        >
          <TouchableOpacity
            onPress={handleGenerate}
            activeOpacity={0.85}
            className="flex-row items-center justify-center bg-amber-400 rounded-2xl py-4"
          >
            <Ionicons name="sparkles-outline" size={20} color="#18181b" />
            <Text className="text-zinc-900 font-bold text-base ml-2">Generar plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SwipeBackWrapper>
  );
}
