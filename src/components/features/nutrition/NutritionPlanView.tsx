import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';
import { RoutineMealSummaryDto } from '@/src/types/nutritionRoutine';
import { PlanSkeleton, RoutinePlanContent } from './RoutinePlanContent';

/**
 * Vista "Plan diario" del módulo Nutrición.
 * Maneja tres estados: sin rutina, Draft pendiente de confirmación, y rutina activa.
 * Lo offline (estado + descarga) vive en el header de la pantalla; el sync de
 * operaciones pendientes lo resuelve el OfflineSyncGate de forma automática.
 */
export function NutritionPlanView() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const {
    routine,
    draft,
    isLoading,
    isGenerating,
    isAccepting,
    isRejecting,
    error,
    generate,
    accept,
    reject,
  } = useNutritionRoutineContext();

  const handleMealPress = useCallback(
    (meal: RoutineMealSummaryDto) => {
      router.push({
        pathname: '/nutrition/meal/[id]' as any,
        params: { id: meal.id },
      });
    },
    [router],
  );

  /** Abre el listado "Mis planes" (ruta pusheada). */
  const handleOpenRoutines = useCallback(() => {
    router.push('/nutrition/routines' as any);
  }, [router]);

  /** Estado de carga inicial o generando */
  if (isLoading || isGenerating) {
    return <PlanSkeleton />;
  }

  /** Estado vacío: sin rutina ni draft */
  if (!routine && !draft) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View className="w-16 h-16 rounded-full bg-amber-900/20 items-center justify-center mb-4">
          <Ionicons name="restaurant-outline" size={32} className="text-amber-400" />
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Sin plan nutricional
        </Text>
        <Text className="text-zinc-400 text-base text-center mb-6 leading-relaxed">
          Generá tu plan semanal personalizado con IA basado en tu perfil nutricional.
        </Text>
        {error && (
          <Text className="text-rose-500 text-sm text-center mb-4">{error}</Text>
        )}
        <TouchableOpacity
          onPress={generate}
          activeOpacity={0.8}
          className="bg-amber-400 px-8 py-4 rounded-xl"
        >
          <Text className="text-zinc-900 font-bold text-base">Generar plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenRoutines}
          activeOpacity={0.7}
          className="flex-row items-center mt-5 py-2"
        >
          <Ionicons name="albums-outline" size={16} color="#fbbf24" />
          <Text className="text-amber-400 font-semibold text-sm ml-1.5">Ver mis planes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** Draft pendiente de confirmación */
  if (draft) {
    const actionDisabled = isAccepting || isRejecting;

    return (
      <View className="flex-1">
        {/* Banner de Draft */}
        <View className="mx-4 mb-2 bg-amber-900/20 border border-amber-700 rounded-xl px-4 py-3 flex-row items-center gap-3">
          <Ionicons name="sparkles-outline" size={20} className="text-amber-400" />
          <Text className="text-amber-300 text-sm font-medium flex-1">
            Plan generado — revisalo antes de activarlo
          </Text>
        </View>

        {error && (
          <Text className="text-rose-500 text-sm text-center mx-4 mb-2">{error}</Text>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        >
          <RoutinePlanContent routine={draft} onMealPress={handleMealPress} />

          {/* Acciones al final del scroll */}
          <View className="px-4 pt-4 gap-2">
            <TouchableOpacity
              onPress={accept}
              disabled={actionDisabled}
              activeOpacity={0.8}
              className={`flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
                actionDisabled ? 'bg-amber-300' : 'bg-amber-400'
              }`}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#18181b" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#18181b" />
              )}
              <Text className="text-zinc-900 font-bold text-base">
                {isAccepting ? 'Activando...' : 'Aceptar plan'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={generate}
                disabled={actionDisabled}
                activeOpacity={0.8}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border gap-1.5 ${
                  actionDisabled ? 'border-zinc-800' : 'border-zinc-700'
                }`}
              >
                <Ionicons
                  name="refresh-outline"
                  size={17}
                  className={actionDisabled ? 'text-zinc-600' : 'text-zinc-300'}
                />
                <Text
                  className={`font-semibold text-sm ${
                    actionDisabled ? 'text-zinc-600' : 'text-zinc-300'
                  }`}
                >
                  Generar otra
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={reject}
                disabled={actionDisabled}
                activeOpacity={0.8}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border gap-1.5 ${
                  actionDisabled ? 'border-zinc-800' : 'border-rose-900'
                }`}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#f43f5e" />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={17}
                    className={actionDisabled ? 'text-zinc-600' : 'text-rose-500'}
                  />
                )}
                <Text
                  className={`font-semibold text-sm ${
                    actionDisabled ? 'text-zinc-600' : 'text-rose-500'
                  }`}
                >
                  {isRejecting ? 'Descartando...' : 'Descartar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  /** Rutina activa confirmada */
  return (
    <View className="flex-1">
      {/* Acceso al listado "Mis planes" */}
      <View className="flex-row justify-end px-4 mb-1">
        <TouchableOpacity
          onPress={handleOpenRoutines}
          activeOpacity={0.7}
          className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-1.5"
        >
          <Ionicons name="albums-outline" size={15} color="#fbbf24" />
          <Text className="text-amber-400 font-semibold text-xs ml-1.5">Mis planes</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
      >
        <RoutinePlanContent routine={routine!} onMealPress={handleMealPress} />
      </ScrollView>
    </View>
  );
}
