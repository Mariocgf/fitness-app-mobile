import { NutritionDashboard } from '@/src/components/features/nutrition/NutritionDashboard';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { MealType } from '@/src/types/nutrition';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NutritionScreen() {
  const router = useRouter();
  const {
    day,
    profile,
    target,
    isLoading,
    error,
    refresh,
  } = useNutritionDay();
  const didInitialFocusRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!didInitialFocusRef.current) {
        didInitialFocusRef.current = true;
        return;
      }

      refresh();
    }, [refresh]),
  );

  const handleMealPress = useCallback((mealType: MealType) => {
    router.push({
      pathname: '/nutrition/register' as any,
      params: { mealType },
    });
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow"
      >
        <NutritionDashboard
          day={day}
          profile={profile}
          target={target}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          onMealPress={handleMealPress}
          onConfigurePress={() => router.push('/onboarding' as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
