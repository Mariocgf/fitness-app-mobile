import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { RoutineFilters } from '@/src/components/features/routine/RoutineFilters';
import { RoutineListCard } from '@/src/components/features/routine/RoutineListCard';
import { useMyRoutines } from '@/src/hooks/useMyRoutines';
import { activateRoutine, deleteRoutine, getRoutineById } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine, RoutineDay, RoutineSummary } from '@/src/types/routine';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

/**
 * Vista de listado paginado de todas las rutinas del usuario.
 * Incluye filtros por fecha y source, y paginación con "cargar más".
 * Diseño con header de color slate y cuerpo blanco/dark con esquinas redondeadas.
 */
export default function RoutinesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const {
    routines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    dateRange,
    sourceFilter,
    setDateRange,
    setSourceFilter,
    loadMore,
    applyFilters,
    refresh,
  } = useMyRoutines(token);

  const [refreshing, setRefreshing] = useState(false);

  /* ── Estado para filtros desplegables ─────────────────────────────────── */
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const handleToggleFilters = useCallback(() => {
    setIsFiltersExpanded(prev => !prev);
  }, []);

  const handleScrollBegin = useCallback(() => {
    if (isFiltersExpanded) {
      setIsFiltersExpanded(false);
    }
  }, [isFiltersExpanded]);

  /* ── Contexto para comunicar estado al tab bar ─────────────────────────── */
  const { setDetailVisible, activeRoutine, setViewingActiveRoutine } = useRoutineDetailContext();

  /* ── Estado para detalle de rutina ────────────────────────────────────── */
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedRoutineSummary, setSelectedRoutineSummary] = useState<RoutineSummary | null>(null);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showEditView, setShowEditView] = useState(false);

  const handleBack = useCallback(() => {
    router.push('/fitness');
  }, [router]);

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setSelectedRoutine(null);
    setSelectedRoutineSummary(null);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleDeleteRoutine = useCallback(async () => {
    if (!selectedRoutine) return;

    Alert.alert(
      'Eliminar rutina',
      '¿Eliminar esta rutina? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'Usuario no autenticado');
                return;
              }
              await deleteRoutine(selectedRoutine.id, token);
              // Cerrar el detalle
              handleCloseDetail();
              // Mostrar mensaje de éxito
              Alert.alert('Éxito', 'La rutina fue eliminada correctamente');
              // Refrescar la lista para quitar la rutina eliminada
              refresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la rutina');
            }
          },
        },
      ],
    );
  }, [selectedRoutine, getToken, handleCloseDetail, refresh]);

  const handleActivateRoutine = useCallback(async (r: Routine) => {
    try {
      const token = await getToken();
      const activated = await activateRoutine(r.id, token);
      setSelectedRoutine(activated);
      await refresh();
    } catch {
      Alert.alert('Error', 'No se pudo activar la rutina. Intentá de nuevo.');
    }
  }, [getToken, refresh]);

  const handleRegenerate = useCallback(async () => {
    // TODO: Implementar regeneración si es necesario
    console.log('[RoutinesScreen] Regenerate not implemented');
  }, []);

  /** Convierte una Routine del backend al formato RoutineDraft del editor */
  const routineToDraft = useCallback((r: Routine) => {
    const DAYS_VALUE_MAP: Record<string, string> = {
      'Lunes': 'monday', 'Martes': 'tuesday', 'Mi\u00e9rcoles': 'wednesday',
      'Jueves': 'thursday', 'Viernes': 'friday', 'S\u00e1bado': 'saturday', 'Domingo': 'sunday',
    };
    return {
      name: r.name,
      days: r.days.map((day: RoutineDay): CreateRoutineDay => ({
        id: day.id,
        value: DAYS_VALUE_MAP[day.day] ?? day.day.toLowerCase(),
        label: day.day,
        exercises: day.exercises.map((ex): CreateRoutineExercise => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.name,
          gifUrl: ex.gifUrl,
          equipments: [],
          sets: parseInt(ex.sets, 10) || 3,
          reps: ex.repType === 'Timed'
            ? parseInt(ex.durationSeconds ?? '30', 10)
            : parseInt(ex.currentRep ?? '12', 10),
          repMode: ex.repType === 'Timed' ? 'secs' : 'reps',
          restSeconds: parseInt(ex.rest, 10) || 60,
          loadType: ex.loadType ?? 'BodyWeight',
          plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
        })),
      })),
    };
  }, []);

  const handleOpenEdit = useCallback((r: Routine) => {
    setEditingRoutine(r);
    setSelectedRoutine(null);
    setSelectedRoutineSummary(null);
    setShowDetail(false);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
    setShowEditView(true);
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleRoutineUpdated = useCallback(async (updated: Routine) => {
    setSelectedRoutine(updated);
    // Refrescar la lista para mostrar cambios
    await refresh();
  }, [refresh]);

  const handleRoutinePress = useCallback(async (routineSummary: RoutineSummary) => {
    setSelectedRoutineSummary(routineSummary);
    setDetailVisible(true);

    // Si es la rutina activa y ya está en memoria, usarla directamente
    const isActiveRoutine = routineSummary.id === activeRoutine?.id;
    if (isActiveRoutine && activeRoutine) {
      setViewingActiveRoutine(true);
      setSelectedRoutine(activeRoutine);
      setShowDetail(true);
      return;
    }

    // Si no es la activa o no está en memoria, hacer fetch
    setIsLoadingRoutine(true);
    try {
      const token = await getToken();
      const fullRoutine = await getRoutineById(routineSummary.id, token);
      setSelectedRoutine(fullRoutine);
      setShowDetail(true);
    } catch (error) {
      console.error('[RoutinesScreen] Error fetching routine:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina. Intentá de nuevo.');
    } finally {
      setIsLoadingRoutine(false);
    }
  }, [getToken, activeRoutine, setViewingActiveRoutine]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setDateRange({ from: null, to: null });
    setSourceFilter('all');
    applyFilters();
  }, [setDateRange, setSourceFilter, applyFilters]);

  const renderRoutineCard = useCallback(
    ({ item }: { item: RoutineSummary }) => (
      <RoutineListCard routine={item} onPress={handleRoutinePress} />
    ),
    [handleRoutinePress]
  );

  const renderSeparator = useCallback(
    () => <View className="h-3" />,
    []
  );

  const renderFooter = useCallback(() => {
    if (routines.length === 0) return null;

    if (isLoadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#a3e635" />
          <Text className="text-slate-400 dark:text-slate-500 text-sm mt-2">
            Cargando más rutinas...
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
            <Text className="text-slate-900 font-semibold text-sm">
              Cargar más rutinas
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="py-6 items-center">
        <Text className="text-slate-400 dark:text-slate-500 text-sm">
          No hay más rutinas
        </Text>
      </View>
    );
  }, [hasMore, isLoadingMore, routines.length, loadMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#a3e635" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-4">
            Cargando rutinas...
          </Text>
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
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="fitness-outline" size={48} color="#94a3b8" />
        <Text className="text-slate-900 dark:text-slate-50 text-base font-medium mt-4 text-center">
          No se encontraron rutinas
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
          {sourceFilter !== 'all' || dateRange.from || dateRange.to
            ? 'Probá ajustando los filtros'
            : 'Creá tu primera rutina desde la pestaña Fitness'}
        </Text>
        {(sourceFilter !== 'all' || dateRange.from || dateRange.to) && (
          <TouchableOpacity
            onPress={handleClearFilters}
            className="mt-4 bg-slate-200 dark:bg-slate-800 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-slate-900 dark:text-slate-50 font-semibold">
              Limpiar filtros
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, error, refresh, sourceFilter, dateRange, handleClearFilters]);

  const header = (
    <View style={{ paddingTop: insets.top }} className="px-4 pb-4">
      {/* Barra de navegación con título centrado */}
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#64748b" />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-slate-50">
          Rutinas
        </Text>

        {/* Placeholder para balancear el layout */}
        <View className="w-10" />
      </View>

      {/* Contador de resultados en el header */}
      {!isLoading && !error && routines.length > 0 && (
        <View className="items-center mt-1">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'}
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
          <RoutineFilters
            dateRange={dateRange}
            sourceFilter={sourceFilter}
            isExpanded={isFiltersExpanded}
            onToggle={handleToggleFilters}
            onDateRangeChange={setDateRange}
            onSourceFilterChange={setSourceFilter}
            onApplyFilters={applyFilters}
            onClearFilters={handleClearFilters}
          />
        </View>

        {/* Lista de rutinas */}
        <FlatList
          data={routines}
          renderItem={renderRoutineCard}
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
          onEdit={selectedRoutine.source === 'Manual' ? () => handleOpenEdit(selectedRoutine) : undefined}
          onActivate={!selectedRoutine.isActive ? () => handleActivateRoutine(selectedRoutine) : undefined}
          onDelete={handleDeleteRoutine}
        />
      )}

      {/* Editor de rutina en modo edición */}
      {showEditView && editingRoutine && (
        <CreateRoutineView
          initialDraft={routineToDraft(editingRoutine)}
          editingRoutineId={editingRoutine.id}
          onClose={() => { setShowEditView(false); setEditingRoutine(null); }}
          onRoutineCreated={(_updated: Routine) => {
            setShowEditView(false);
            setEditingRoutine(null);
            refresh();
          }}
        />
      )}

      {/* Loading mientras se carga la rutina */}
      {isLoadingRoutine && selectedRoutineSummary && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#a3e635" />
            <Text className="text-slate-900 dark:text-slate-50 mt-4 font-medium">
              Cargando rutina...
            </Text>
          </View>
        </View>
      )}
    </SwipeBackWrapper>
  );
}
