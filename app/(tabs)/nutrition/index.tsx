import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { NutritionDashboard } from '@/src/components/features/nutrition/NutritionDashboard';
import { NutritionPlanView } from '@/src/components/features/nutrition/NutritionPlanView';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { MealType } from '@/src/types/nutrition';
import { getMealItems, MEAL_ORDER } from '@/src/utils/nutrition.utils';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'resumen' | 'plan';

const TAB_OPTIONS: { label: string; value: Tab }[] = [
  { label: 'Resumen', value: 'resumen' },
  { label: 'Plan', value: 'plan' },
];

export default function NutritionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<Tab>(
    params.tab === 'plan' ? 'plan' : 'resumen',
  );

  /** Sincroniza el tab si se navega desde afuera con ?tab=plan */
  useEffect(() => {
    if (params.tab === 'plan') setActiveTab('plan');
  }, [params.tab]);

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

  /** Abre el registro en la primera comida pendiente del día (o desayuno). */
  const handleRegisterPress = useCallback(() => {
    const nextMeal =
      MEAL_ORDER.find((mealType) => getMealItems(day, mealType).length === 0) ??
      MEAL_ORDER[0];
    handleMealPress(nextMeal);
  }, [day, handleMealPress]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Título siempre visible */}
      <View className="px-4 pt-8 pb-3">
        <Text className="text-white text-4xl font-bold">Nutrición</Text>
      </View>

      {/* Toggle Resumen / Plan */}
      <View className="mx-4 mb-3">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={setActiveTab}
          accent="amber"
        />
      </View>

      {/* Contenido según tab activo */}
      {activeTab === 'resumen' ? (
        <NutritionDashboard
          day={day}
          profile={profile}
          target={target}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          onMealPress={handleMealPress}
          onRegisterPress={handleRegisterPress}
          onConfigurePress={() => router.push('/onboarding' as any)}
        />
      ) : (
        <NutritionPlanView />
      )}
    </SafeAreaView>
  );
}
