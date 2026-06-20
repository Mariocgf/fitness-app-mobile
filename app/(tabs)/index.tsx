import { ModuleCard } from '@/src/components/features/home/ModuleCard';
import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { getActiveModules } from '@/src/services/module.service';
import { getActiveRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import { Routine } from '@/src/types/routine';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Devuelve el nombre del día de hoy en español */
const getTodayNameSpanish = (): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
};

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isFetchingRoutine, setIsFetchingRoutine] = useState(true);

  const { setActiveRoutine } = useRoutineDetailContext();
  const { routine: nutritionRoutine, isLoading: isLoadingNutrition } = useNutritionRoutineContext();

  const userName = user?.firstName ?? 'Usuario';

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_routine');
        if (stored) {
          const parsed = JSON.parse(stored) as Routine;
          setRoutine(parsed);
          setActiveRoutine(parsed);
        }

        const token = await getToken();
        if (!token) return;

        const [modulesResult, routineResult] = await Promise.allSettled([
          getActiveModules(token),
          getActiveRoutine(token),
        ]);

        if (modulesResult.status === 'fulfilled') {
          await AsyncStorage.setItem('@active_modules', JSON.stringify(modulesResult.value));
        }

        if (routineResult.status === 'fulfilled') {
          const fetched = routineResult.value;
          if (fetched) {
            setRoutine(fetched);
            setActiveRoutine(fetched);
            await AsyncStorage.setItem('@user_routine', JSON.stringify(fetched));
          } else {
            setRoutine(null);
            setActiveRoutine(null);
            await AsyncStorage.removeItem('@user_routine');
          }
        }
      } catch (error) {
        console.error('Error cargando datos en Home:', error);
      } finally {
        setIsFetchingRoutine(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Resumen de la rutina activa para el card */
  const routineTitle = routine?.name ?? 'Rutina';
  const todayDay = getTodayNameSpanish();
  const firstDay = routine?.days[0];
  const exerciseCount = firstDay?.exercises.length ?? 0;
  const approxTime = firstDay?.approxTimeSession ?? '45 min';
  const routineMeta = exerciseCount > 0 ? `${exerciseCount} ejercicios • ${approxTime}` : undefined;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerClassName="pt-8 pb-10">
        <GreetingHeader userName={userName} />

        {/* Card: Rutina */}
        <ModuleCard
          title={routineTitle}
          subtitle={routine ? todayDay : undefined}
          meta={routine ? routineMeta : undefined}
          description={!routine && !isFetchingRoutine ? 'No tenés una rutina activa.' : undefined}
          actionLabel={routine ? 'Continuar rutina' : 'Generar rutina'}
          onAction={() => router.navigate('/(tabs)/fitness')}
          isLoading={isFetchingRoutine}
        />

        {/* Card: Nutrición */}
        <ModuleCard
          title="Nutrición"
          description={
            !isLoadingNutrition && !nutritionRoutine
              ? 'No tenés un plan nutricional activo.'
              : nutritionRoutine?.name
          }
          actionLabel={nutritionRoutine ? 'Ver plan' : 'Crear plan'}
          onAction={() => router.navigate('/(tabs)/nutrition')}
          isLoading={isLoadingNutrition}
        />

        {/* Card: Salud */}
        <ModuleCard
          title="Salud"
          description="No tenés objetivos configurados."
          actionLabel="Configurar"
          onAction={() => router.navigate('/(tabs)/health')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
