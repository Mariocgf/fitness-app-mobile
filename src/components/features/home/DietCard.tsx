import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { confirm } from '@/src/components/ui/feedback';
import { useNutritionRoutineContext } from '@/src/store/nutrition-routine-context';

/**
 * Card del módulo Nutrición en Home.
 * Estados: sin rutina → generar, generando → loading, draft pendiente → revisar, con rutina activa → ver plan.
 */
export function DietCard() {
  const router = useRouter();
  const { routine, draft, isLoading, isGenerating, error, generate } = useNutritionRoutineContext();

  const goToPlanTab = () => {
    router.push({
      pathname: '/(tabs)/nutrition' as any,
      params: { tab: 'plan' },
    });
  };

  /** Genera y navega al tab de plan para que el usuario confirme el draft */
  const handleGenerate = async () => {
    await generate();
    goToPlanTab();
  };

  const handleRegenerate = async () => {
    const confirmed = await confirm({
      title: 'Generar nuevo plan',
      message:
        'Se generará un nuevo borrador para revisar. Tu plan activo no cambia hasta que lo aceptes.',
      confirmText: 'Generar',
      cancelText: 'Cancelar',
    });
    if (confirmed) handleGenerate();
  };

  /** Hay un draft pendiente de revisión */
  if (draft) {
    return (
      <View className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-2xl p-5 mx-4 mt-3">
        <View className="flex-row items-start mb-4">
          <View className="flex-1 pr-4">
            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
              Plan listo para revisar
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 leading-5">
              {draft.name}
            </Text>
          </View>
          <Ionicons name="sparkles" size={40} className="text-amber-400" />
        </View>
        <TouchableOpacity
          onPress={goToPlanTab}
          activeOpacity={0.8}
          className="py-4 rounded-xl items-center bg-amber-400"
        >
          <Text className="text-black font-bold text-base">Revisar y confirmar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mx-4 mt-3">
      <View className="flex-row items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
            {routine ? 'Tu plan nutricional' : 'Generá tu dieta'}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 leading-5">
            {routine
              ? routine.name
              : 'No tenés plan activo.\nObtené tu primera dieta personalizada ahora.'}
          </Text>
          {error && (
            <Text className="text-rose-500 text-xs mt-2 leading-snug">{error}</Text>
          )}
        </View>
        <Ionicons
          name={routine ? 'nutrition-outline' : 'sparkles'}
          size={40}
          className="text-slate-900 dark:text-slate-50"
        />
      </View>

      {routine ? (
        <View className="gap-2">
          <TouchableOpacity
            onPress={goToPlanTab}
            activeOpacity={0.8}
            className="py-4 rounded-xl items-center bg-amber-400"
          >
            <Text className="text-black font-bold text-base">Ver plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRegenerate}
            activeOpacity={0.8}
            className="py-3 rounded-xl items-center"
          >
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              Generar nuevo plan
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isLoading || isGenerating}
          activeOpacity={0.8}
          className="py-4 rounded-xl items-center bg-amber-400"
        >
          {isLoading || isGenerating ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#000" size="small" />
              <Text className="text-black font-bold text-base">
                {isGenerating ? 'Generando...' : 'Cargando...'}
              </Text>
            </View>
          ) : (
            <Text className="text-black font-bold text-base">Generar dieta</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
