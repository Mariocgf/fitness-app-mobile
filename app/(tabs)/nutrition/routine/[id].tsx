import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import {
  PlanSkeleton,
  RoutinePlanContent,
} from '@/src/components/features/nutrition/RoutinePlanContent';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import {
  activateNutritionRoutine,
  getNutritionRoutineById,
} from '@/src/services/nutritionRoutine.service';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import {
  NutritionRoutineDto,
  RoutineMealSummaryDto,
} from '@/src/types/nutritionRoutine';
import { ROUTINE_STATUS_LABELS } from '@/src/utils/nutritionRoutine.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';

/**
 * Detalle de un plan nutricional del listado "Mis planes" (días + comidas completos).
 *
 * Origen de datos:
 * - Si el id coincide con la rutina activa o el draft del contexto, usa ese snapshot
 *   (ya trae días/comidas) sin pegarle al backend.
 * - Si no, llama `getNutritionRoutineById` (`GET /api/nutrition-routine/{id}`), que
 *   devuelve la misma forma que `/active` para cualquier rutina del usuario.
 *
 * Las macros/receta por comida se cargan en la pantalla de meal reutilizando
 * `getRoutineMealDetail` (`GET /meals/{mealId}`). Permite activar el plan si todavía
 * no es la rutina activa.
 */
export default function NutritionRoutineDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { routine: activeRoutine, draft, refresh: refreshContext } = useNutritionRoutineContext();

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const mountedRef = useRef(true);
  const requestRef = useRef<AbortController | null>(null);

  // Snapshot del contexto si el id coincide con la rutina activa o el draft.
  const contextRoutine: NutritionRoutineDto | null =
    activeRoutine?.id === id ? activeRoutine : draft?.id === id ? draft : null;

  const [routine, setRoutine] = useState<NutritionRoutineDto | null>(contextRoutine);
  const [isLoading, setIsLoading] = useState(!contextRoutine);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const handleBack = useCallback(() => router.back(), [router]);

  const handleMealPress = useCallback(
    (meal: RoutineMealSummaryDto) => {
      router.push({ pathname: '/nutrition/meal/[id]' as any, params: { id: meal.id } });
    },
    [router],
  );

  /** Carga el plan por id (solo cuando no hay snapshot de contexto). */
  const loadRoutine = useCallback(async () => {
    if (!id) return;
    const controller = beginAbortableRequest(requestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const data = await getNutritionRoutineById(id, token, signal);
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) setRoutine(data);
    } catch (err: any) {
      if (signal.aborted || isRequestCanceled(err)) return;
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) {
        setError(err?.message ?? 'No pudimos cargar el plan. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current && isCurrentRequest(requestRef, controller)) setIsLoading(false);
      endAbortableRequest(requestRef, controller);
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    if (!contextRoutine) {
      loadRoutine();
    }
    return () => {
      mountedRef.current = false;
      abortRequest(requestRef);
    };
    // contextRoutine se evalúa una vez al montar; los cambios de id remontan la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRoutine]);

  const isActive = activeRoutine?.id === id || routine?.status === 'Active';

  /** Activa el plan y vuelve al tab Plan, que ya muestra la rutina activa. */
  const handleActivate = useCallback(async () => {
    if (!id || isActivating || isActive) return;
    setIsActivating(true);
    setActivateError(null);
    try {
      const token = await getTokenRef.current();
      await activateNutritionRoutine(id, token);
      await refreshContext();
      if (mountedRef.current) router.dismissAll();
    } catch (err: any) {
      if (mountedRef.current) {
        setActivateError(err?.message ?? 'No pudimos activar tu plan. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsActivating(false);
    }
  }, [id, isActivating, isActive, refreshContext, router]);

  const headerTitle = routine?.name ?? name ?? 'Plan';
  const statusLabel = routine ? ROUTINE_STATUS_LABELS[routine.status] : null;

  const header = (
    <View style={{ paddingTop: insets.top }} className="px-4">
      <View className="flex-row items-center py-2">
        <TouchableOpacity onPress={handleBack} className="-ml-2 p-2" hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center pb-3">
        <Text className="text-white text-3xl font-bold flex-1 pr-3" numberOfLines={2}>
          {headerTitle}
        </Text>
        {statusLabel && (
          <View
            className={`px-2.5 py-1 rounded-full ${
              isActive ? 'bg-amber-400/15' : 'bg-zinc-800'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}
            >
              {isActive ? 'Activo' : statusLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <View className="flex-1 bg-zinc-950">
        {header}

        {isLoading ? (
          <PlanSkeleton />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-white text-base font-medium mt-4 text-center">{error}</Text>
            <TouchableOpacity
              onPress={loadRoutine}
              className="mt-4 bg-amber-400 px-6 py-3 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-zinc-900 font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : routine ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 96 }}
          >
            <RoutinePlanContent routine={routine} onMealPress={handleMealPress} />
          </ScrollView>
        ) : null}

        {/* CTA flotante "Activar plan" (oculto si ya es la rutina activa) */}
        {routine && !isActive && (
          <View
            style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
          >
            {activateError && (
              <Text className="text-rose-400 text-sm text-center mb-2">{activateError}</Text>
            )}
            <TouchableOpacity
              onPress={handleActivate}
              disabled={isActivating}
              activeOpacity={0.85}
              className="flex-row items-center justify-center bg-amber-400 rounded-2xl py-4"
              style={{ opacity: isActivating ? 0.7 : 1 }}
            >
              {isActivating ? (
                <ActivityIndicator size="small" color="#18181b" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#18181b" />
              )}
              <Text className="text-zinc-900 font-bold text-base ml-2">
                {isActivating ? 'Activando...' : 'Activar plan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SwipeBackWrapper>
  );
}
