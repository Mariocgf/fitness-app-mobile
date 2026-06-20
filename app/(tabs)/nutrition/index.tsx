import { NutritionDashboard } from '@/src/components/features/nutrition/NutritionDashboard';
import { NutritionPlanView } from '@/src/components/features/nutrition/NutritionPlanView';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { MealType } from '@/src/types/nutrition';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'resumen' | 'plan';

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

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* Título siempre visible */}
      <View className="px-4 pt-8 pb-2">
        <Text className="text-slate-900 dark:text-slate-50 text-4xl font-bold">
          Nutrición
        </Text>
      </View>

      {/* Toggle Resumen / Plan diario */}
      <View className="mx-4 mb-2 bg-white dark:bg-slate-900 rounded-full p-1 flex-row border border-slate-200 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => setActiveTab('resumen')}
          activeOpacity={0.75}
          className={`flex-1 py-2.5 rounded-full items-center ${
            activeTab === 'resumen' ? 'bg-amber-400' : ''
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === 'resumen'
                ? 'text-black'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('plan')}
          activeOpacity={0.75}
          className={`flex-1 py-2.5 rounded-full items-center ${
            activeTab === 'plan' ? 'bg-amber-400' : ''
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === 'plan'
                ? 'text-black'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Plan diario
          </Text>
        </TouchableOpacity>
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
          onConfigurePress={() => router.push('/onboarding' as any)}
        />
      ) : (
        <NutritionPlanView />
      )}
    </SafeAreaView>
  );
}
