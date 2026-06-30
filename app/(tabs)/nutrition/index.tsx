import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { NutritionDashboard } from '@/src/components/features/nutrition/NutritionDashboard';
import { NutritionPlanView } from '@/src/components/features/nutrition/NutritionPlanView';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { useNutritionOfflineRoutine } from '@/src/hooks/useNutritionOfflineRoutine';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import { MealType } from '@/src/types/nutrition';
import { getMealItems, MEAL_ORDER } from '@/src/utils/nutrition.utils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
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

  /** Rutina activa: define si mostramos el control de descarga en el header. */
  const { routine } = useNutritionRoutineContext();
  /** Fuente única del estado offline; se baja por props a la vista del plan. */
  const offline = useNutritionOfflineRoutine();
  const showOfflineButton = activeTab === 'plan' && !!routine;

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
      {/* Título siempre visible. En el tab Plan con rutina activa, la descarga
          offline vive a la derecha, al nivel del título. */}
      <View className="px-4 pt-8 pb-3 flex-row items-center justify-between">
        <Text className="text-white text-4xl font-bold">Nutrición</Text>
        {showOfflineButton && (
          <TouchableOpacity
            onPress={offline.download}
            disabled={offline.isDownloading}
            activeOpacity={0.7}
            className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-2"
            style={{ opacity: offline.isDownloading ? 0.6 : 1 }}
          >
            {offline.isDownloading ? (
              <ActivityIndicator size="small" color="#fbbf24" />
            ) : (
              <Ionicons
                name={
                  offline.status.conflictCount > 0
                    ? 'warning-outline'
                    : offline.status.isAvailable
                      ? 'cloud-done-outline'
                      : 'cloud-download-outline'
                }
                size={16}
                color={offline.status.conflictCount > 0 ? '#f59e0b' : '#fbbf24'}
              />
            )}
            <Text className="text-amber-400 font-semibold text-xs ml-1.5">
              {offline.status.isAvailable ? 'Actualizar' : 'Descargar'}
            </Text>
          </TouchableOpacity>
        )}
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
