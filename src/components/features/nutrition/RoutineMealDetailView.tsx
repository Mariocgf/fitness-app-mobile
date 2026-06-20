import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoutineMealDetailDto, RoutineMealSummaryDto } from '@/src/types/nutritionRoutine';
import { MEAL_LABELS } from '@/src/utils/nutrition.utils';
import {
  computeMacroPercent,
  parseMacro,
  parseInstructionsToSteps,
} from '@/src/utils/nutritionRoutine.utils';
import { MacroRing } from './MacroRing';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

function SkeletonItem({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

interface MacroRowProps {
  color: string;
  label: string;
  grams: number;
  percent: number;
}

function MacroRow({ color, label, grams, percent }: MacroRowProps) {
  return (
    <View className="flex-row items-center py-3 border-b border-slate-100 dark:border-slate-800">
      <View className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: color }} />
      <Text className="flex-1 text-slate-900 dark:text-slate-50 text-base">{label}</Text>
      <View className="items-end">
        <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">{grams} g</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs">{percent}% del total</Text>
      </View>
    </View>
  );
}

interface RoutineMealDetailViewProps {
  summary: RoutineMealSummaryDto | null;
  detail: RoutineMealDetailDto | null;
  isLoading: boolean;
  error: string | null;
  isLogging: boolean;
  logError: string | null;
  onBack: () => void;
  onRetry: () => void;
  onLog: () => void;
}

/**
 * Vista de detalle de una comida de la rutina IA.
 * Muestra: tipo, nombre, anillo de macros, descripción, ingredientes y preparación.
 * El botón "Registrar alimento" queda deshabilitado hasta que el backend lo soporte.
 */
export function RoutineMealDetailView({
  summary,
  detail,
  isLoading,
  error,
  isLogging,
  logError,
  onBack,
  onRetry,
  onLog,
}: RoutineMealDetailViewProps) {
  const insets = useSafeAreaInsets();
  const displayName = detail?.name ?? summary?.name ?? '';
  const displayType = detail?.type ?? summary?.type;
  const displayDescription = detail?.description ?? summary?.description ?? '';
  const typeLabel = displayType ? MEAL_LABELS[displayType] : '';

  /* Macros parseados */
  const calories = detail ? parseMacro(detail.calories) : 0;
  const proteins = detail ? parseMacro(detail.proteins) : 0;
  const carbs = detail ? parseMacro(detail.carbs) : 0;
  const fats = detail ? parseMacro(detail.fats) : 0;

  const proteinKcal = proteins * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fats * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal || calories;

  const steps = detail ? parseInstructionsToSteps(detail.recipe.instructions) : [];

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) + 8 + 72 + 16 }}
      >
        {/* Header con back */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-4 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={22} className="text-slate-900 dark:text-slate-100" />
          </TouchableOpacity>
          <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold flex-1" numberOfLines={2}>
            {displayName || ' '}
          </Text>
        </View>

        {/* Badge de tipo */}
        {typeLabel ? (
          <View className="px-4 pb-4">
            <View className="self-start bg-amber-400 px-3 py-1 rounded-full">
              <Text className="text-black text-sm font-semibold">{typeLabel}</Text>
            </View>
          </View>
        ) : null}

        {/* Anillo de macros */}
        {isLoading ? (
          <View className="px-4 mb-4">
            <SkeletonItem className="w-full h-64 rounded-2xl" />
          </View>
        ) : detail ? (
          <View className="bg-white dark:bg-slate-900 rounded-2xl mx-4 mb-4 p-4">
            {/* Calorías */}
            <View className="flex-row items-center mb-4">
              <Ionicons name="flame-outline" size={18} className="text-amber-400 mr-1.5" />
              <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
                {calories} kcal
              </Text>
            </View>

            {/* Anillo + leyenda */}
            <View className="flex-row items-center gap-4">
              <MacroRing
                proteinGrams={proteins}
                carbsGrams={carbs}
                fatGrams={fats}
                targetCalories={calories}
                centerTop={String(Math.round(calories))}
                centerBottom="kcal"
                size={180}
              />
              <View className="flex-1">
                <MacroRow
                  color="#3b82f6"
                  label="Proteína"
                  grams={Math.round(proteins)}
                  percent={computeMacroPercent(proteinKcal, totalKcal)}
                />
                <MacroRow
                  color="#f97316"
                  label="Carbohidratos"
                  grams={Math.round(carbs)}
                  percent={computeMacroPercent(carbsKcal, totalKcal)}
                />
                <MacroRow
                  color="#10b981"
                  label="Grasa"
                  grams={Math.round(fats)}
                  percent={computeMacroPercent(fatKcal, totalKcal)}
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* Error */}
        {error && !isLoading && (
          <View className="mx-4 mb-4 p-4 bg-white dark:bg-slate-900 rounded-2xl items-center">
            <Text className="text-rose-500 text-sm text-center mb-3">{error}</Text>
            <TouchableOpacity
              onPress={onRetry}
              className="bg-amber-400 px-6 py-2 rounded-xl"
            >
              <Text className="text-black font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Descripción */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl mx-4 mb-4 p-4">
          <View className="flex-row items-center mb-2 gap-2">
            <Ionicons name="document-text-outline" size={18} className="text-slate-900 dark:text-slate-50" />
            <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">Descripción</Text>
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {displayDescription || ' '}
          </Text>
        </View>

        {/* Ingredientes */}
        {detail && detail.recipe.ingredients.length > 0 && (
          <View className="bg-white dark:bg-slate-900 rounded-2xl mx-4 mb-4 p-4">
            <View className="flex-row items-center mb-3 gap-2">
              <Ionicons name="list-outline" size={18} className="text-slate-900 dark:text-slate-50" />
              <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">Ingredientes</Text>
            </View>
            {detail.recipe.ingredients.map((ing, idx) => (
              <View key={idx} className="flex-row items-start gap-2 mb-2">
                <View className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 items-center justify-center mt-0.5 flex-shrink-0">
                  <Ionicons name="checkmark" size={11} className="text-slate-400 dark:text-slate-500" />
                </View>
                <Text className="flex-1 text-slate-700 dark:text-slate-300 text-sm leading-snug">
                  <Text className="font-semibold">{ing.amount} </Text>
                  {ing.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Preparación */}
        {detail && steps.length > 0 && (
          <View className="bg-white dark:bg-slate-900 rounded-2xl mx-4 mb-4 p-4">
            <View className="flex-row items-center mb-3 gap-2">
              <Ionicons name="restaurant-outline" size={18} className="text-slate-900 dark:text-slate-50" />
              <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">Preparación</Text>
            </View>
            {steps.map((step, idx) => (
              <View key={idx} className="flex-row gap-3 mb-3">
                <View className="w-7 h-7 rounded-full bg-amber-400 items-center justify-center flex-shrink-0 mt-0.5">
                  <Text className="text-black text-xs font-bold">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skeleton de contenido mientras carga */}
        {isLoading && (
          <View className="px-4 gap-3">
            <SkeletonItem className="w-full h-20 rounded-2xl" />
            <SkeletonItem className="w-full h-32 rounded-2xl" />
          </View>
        )}

        {/* Botón registrar */}
        <View className="px-4 mt-2">
          {logError ? (
            <Text className="text-rose-500 text-xs text-center mb-2">{logError}</Text>
          ) : null}
          <TouchableOpacity
            onPress={onLog}
            disabled={!detail || isLogging}
            activeOpacity={0.8}
            className="bg-zinc-950 dark:bg-zinc-50 py-4 rounded-2xl items-center"
            style={{ opacity: !detail || isLogging ? 0.4 : 1 }}
          >
            <Text className="text-zinc-50 dark:text-zinc-950 font-bold text-base">
              {isLogging ? 'Registrando...' : 'Registrar alimento'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
