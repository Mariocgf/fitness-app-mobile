import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { HealthAccessCard } from '@/src/components/features/home/HealthAccessCard';
import { HydrationQuickAddCard } from '@/src/components/features/home/HydrationQuickAddCard';
import { MoodQuickCard } from '@/src/components/features/home/MoodQuickCard';
import { NutritionTodayCard } from '@/src/components/features/home/NutritionTodayCard';
import { RoutineTodayCard } from '@/src/components/features/home/RoutineTodayCard';
import { SleepQuickCard } from '@/src/components/features/home/SleepQuickCard';
import { useHomeDashboard } from '@/src/hooks/useHomeDashboard';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { getTodayDateKey } from '@/src/utils/nutrition.utils';

/** Encabezado de sección del Home (eyebrow en mayúsculas). */
function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest px-4 mt-2 mb-1">
      {children}
    </Text>
  );
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { setActiveRoutine } = useRoutineDetailContext();

  const {
    routine,
    trainedToday,
    isLoadingRoutine,
    wellness,
    isLoadingWellness,
    nutrition,
    isSubmitting,
    logMood,
    logSleep,
    logHydration,
    refresh,
  } = useHomeDashboard();

  const userName = user?.firstName ?? 'Usuario';

  // Mantenemos el contexto de rutina sincronizado para que Fitness pueda abrirla.
  useEffect(() => {
    setActiveRoutine(routine);
  }, [routine, setActiveRoutine]);

  // ── Pendientes de hoy (binarios: se ocultan al completarse) ──
  const pendingRoutine = routine != null && !trainedToday;
  const pendingMood = !isLoadingWellness && wellness.mood == null;
  const pendingSleep = !isLoadingWellness && wellness.sleep == null;
  const hasPending = pendingRoutine || pendingMood || pendingSleep;
  const isLoading = isLoadingRoutine || isLoadingWellness;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView
        contentContainerClassName="pt-8 pb-10 gap-3"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor="#a1a1aa"
          />
        }
      >
        <GreetingHeader userName={userName} avatarUrl={user?.imageUrl} />

        {/* ── Zona 1: Para hoy ── */}
        {hasPending ? <SectionTitle>Para hoy</SectionTitle> : null}

        <View className="px-4 gap-3">
          {pendingRoutine && routine ? (
            <RoutineTodayCard
              routine={routine}
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/fitness',
                  params: { openRoutineId: routine.id },
                })
              }
            />
          ) : null}

          {pendingMood ? (
            <MoodQuickCard
              onSelect={(mood) => logMood({ date: getTodayDateKey(), mood })}
              isSubmitting={isSubmitting}
            />
          ) : null}

          {pendingSleep ? (
            <SleepQuickCard onSubmit={logSleep} isSubmitting={isSubmitting} />
          ) : null}
        </View>

        {/* Estado "todo al día" cuando no queda nada pendiente */}
        {!hasPending && !isLoading ? (
          <View className="mx-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 items-center gap-2">
            <Ionicons name="checkmark-circle" size={40} color="#a3e635" />
            <Text className="text-white text-lg font-bold">Todo al día</Text>
            <Text className="text-zinc-400 text-sm text-center">
              Ya registraste lo importante de hoy. Seguí abajo con el resto.
            </Text>
          </View>
        ) : null}

        {/* ── Zona 2: Tu día (siempre accesible) ── */}
        <SectionTitle>Tu día</SectionTitle>

        <View className="px-4 gap-3">
          <NutritionTodayCard
            consumedCalories={nutrition.consumedCalories}
            targetCalories={nutrition.targetCalories}
            onPress={() => router.navigate('/(tabs)/nutrition')}
          />

          <HydrationQuickAddCard
            todayMl={wellness.hydrationMl}
            onAdd={(amountMl) =>
              logHydration({ date: getTodayDateKey(), amountMl, beverageType: 'Water' })
            }
            isSubmitting={isSubmitting}
          />

          <HealthAccessCard onPress={() => router.navigate('/(tabs)/health')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
