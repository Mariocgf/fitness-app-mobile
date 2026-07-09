import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { GeneratePlanCard } from '@/src/components/features/home/GeneratePlanCard';
import { HealthAccessCard } from '@/src/components/features/home/HealthAccessCard';
import { HydrationQuickAddCard } from '@/src/components/features/home/HydrationQuickAddCard';
import { MoodQuickCard } from '@/src/components/features/home/MoodQuickCard';
import { NutritionTodayCard } from '@/src/components/features/home/NutritionTodayCard';
import { RoutineTodayCard } from '@/src/components/features/home/RoutineTodayCard';
import { SleepQuickCard } from '@/src/components/features/home/SleepQuickCard';
import { useHomeDashboard } from '@/src/hooks/useHomeDashboard';
import { getNutritionDataVersion } from '@/src/store/nutrition-sync';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
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
  const tabBarHeight = useBottomTabBarHeight();
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
    refreshNutrition,
    refresh,
  } = useHomeDashboard();

  // Rutina de nutrición (plan de comidas): vive en su propio contexto, no en el
  // dashboard. La usamos para el estado vacío "Generá tu dieta" del Home.
  const {
    routine: nutritionRoutine,
    draft: nutritionDraft,
    isLoading: isLoadingNutritionRoutine,
    isGenerating: isGeneratingNutrition,
    generate: generateNutritionRoutine,
  } = useNutritionRoutineContext();

  const userName = user?.firstName ?? 'Usuario';

  // Mantenemos el contexto de rutina sincronizado para que Fitness pueda abrirla.
  useEffect(() => {
    setActiveRoutine(routine);
  }, [routine, setActiveRoutine]);

  // Refresca la nutrición al volver al Home solo si se registró comida desde
  // otra vista (la versión avanzó). Volver de una vista de lectura no refetchea.
  const lastNutritionVersionRef = useRef(getNutritionDataVersion());
  useFocusEffect(
    useCallback(() => {
      const current = getNutritionDataVersion();
      if (current !== lastNutritionVersionRef.current) {
        lastNutritionVersionRef.current = current;
        refreshNutrition();
      }
    }, [refreshNutrition]),
  );

  // ── Pendientes de hoy (binarios: se ocultan al completarse) ──
  const pendingRoutine = routine != null && !trainedToday;
  const pendingMood = !isLoadingWellness && wellness.mood == null;
  const pendingSleep = !isLoadingWellness && wellness.sleep == null;
  const hasPending = pendingRoutine || pendingMood || pendingSleep;
  const isLoading = isLoadingRoutine || isLoadingWellness;

  // ── Estados vacíos: sin rutina de ejercicio y/o de nutrición ──
  const needsFitnessPlan = !isLoadingRoutine && routine == null;
  const needsNutritionPlan =
    !isLoadingNutritionRoutine && nutritionRoutine == null && nutritionDraft == null;
  const needsAnyPlan = needsFitnessPlan || needsNutritionPlan;

  // Genera el borrador de nutrición y lleva al tab de plan para confirmarlo
  // (la generación de nutrición no activa el plan automáticamente).
  const handleGenerateNutrition = useCallback(async () => {
    await generateNutritionRoutine();
    router.push({ pathname: '/(tabs)/nutrition' as any, params: { tab: 'plan' } });
  }, [generateNutritionRoutine, router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-8 gap-3"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
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

        {/* ── Armá tu plan: estados vacíos de rutina de ejercicio / nutrición ── */}
        {needsAnyPlan ? (
          <>
            <SectionTitle>Armá tu plan</SectionTitle>
            <View className="px-4 gap-3">
              {needsFitnessPlan ? (
                <GeneratePlanCard
                  eyebrow="Rutina"
                  title="Generá tu rutina"
                  subtitle="Obtené tu primer plan de entrenamiento personalizado con IA."
                  icon="barbell"
                  accentColor="#a3e635"
                  ctaLabel="Generar rutina"
                  generatingLabel="Generando..."
                  onGenerate={() => router.push({ pathname: '/fitness', params: { openGenerate: '1' } })}
                  isGenerating={false}
                />
              ) : null}

              {needsNutritionPlan ? (
                <GeneratePlanCard
                  eyebrow="Nutrición"
                  title="Generá tu dieta"
                  subtitle="Obtené tu primer plan de comidas personalizado con IA."
                  icon="restaurant"
                  accentColor="#fbbf24"
                  ctaLabel="Generar dieta"
                  generatingLabel="Generando..."
                  onGenerate={handleGenerateNutrition}
                  isGenerating={isGeneratingNutrition}
                />
              ) : null}
            </View>
          </>
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
