import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { RoutineMealDetailView } from '@/src/components/features/nutrition/RoutineMealDetailView';
import { useRoutineMealDetail } from '@/src/hooks/useRoutineMealDetail';
import { logRoutineMeal } from '@/src/services/nutritionRoutine.service';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export default function RoutineMealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routine } = useNutritionRoutineContext();
  const { getToken } = useAuth();

  const { detail, isLoading, error, refetch } = useRoutineMealDetail(id ?? '');

  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const summary = useMemo(() => {
    if (!routine || !id) return null;
    for (const day of routine.days) {
      const meal = day.meals.find((m) => m.id === id);
      if (meal) return meal;
    }
    return null;
  }, [routine, id]);

  const handleLog = useCallback(async () => {
    if (!id || isLogging) return;
    setIsLogging(true);
    setLogError(null);
    try {
      const token = await getToken();
      await logRoutineMeal(id, getTodayIso(), token);
      if (mountedRef.current) router.back();
    } catch (err: any) {
      if (mountedRef.current) {
        setLogError(err?.message ?? 'No pudimos registrar la comida. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsLogging(false);
    }
  }, [id, isLogging, getToken, router]);

  return (
    <RoutineMealDetailView
      summary={summary}
      detail={detail}
      isLoading={isLoading}
      error={error}
      isLogging={isLogging}
      logError={logError}
      onBack={() => router.back()}
      onRetry={refetch}
      onLog={handleLog}
    />
  );
}
