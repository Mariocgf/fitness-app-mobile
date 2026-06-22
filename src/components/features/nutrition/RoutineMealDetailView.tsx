import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { RoutineMealDetailDto, RoutineMealSummaryDto } from '@/src/types/nutritionRoutine';
import { MEAL_ICONS, MEAL_LABELS } from '@/src/utils/nutrition.utils';
import { parseMacro, parseInstructionsToSteps } from '@/src/utils/nutritionRoutine.utils';
import { MacroBreakdownCard } from './MacroBreakdownCard';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const AMBER = '#fbbf24';

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

  return <Animated.View style={{ opacity }} className={`bg-zinc-800 ${className}`} />;
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
 * Vista de detalle de una comida de la rutina IA (dark zinc/amber).
 * Muestra: tipo, nombre, card de macros (kcal + columnas), ingredientes,
 * preparación y el CTA "Registrar alimento".
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
  /* El CTA flota sobre el tab bar nativo (mismo patrón que FoodRegisterView) */
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;
  const displayName = detail?.name ?? summary?.name ?? '';
  const displayType = detail?.type ?? summary?.type;
  const typeLabel = displayType ? MEAL_LABELS[displayType] : '';

  /* Macros parseados */
  const calories = detail ? parseMacro(detail.calories) : 0;
  const proteins = detail ? parseMacro(detail.proteins) : 0;
  const carbs = detail ? parseMacro(detail.carbs) : 0;
  const fats = detail ? parseMacro(detail.fats) : 0;

  const steps = detail ? parseInstructionsToSteps(detail.recipe.instructions) : [];

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomOffset + 72 + 16 }}
      >
        {/* Header con back */}
        <View style={{ paddingTop: insets.top + 16 }} className="px-4">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#f4f4f5" />
          </TouchableOpacity>
        </View>

        {/* Título centrado */}
        <Text className="text-white text-3xl font-bold text-center px-6 mt-3" numberOfLines={3}>
          {displayName || ' '}
        </Text>

        {/* Badge de tipo (outline + ícono) */}
        {typeLabel ? (
          <View className="items-center mt-3 mb-5">
            <View className="flex-row items-center gap-2 border border-zinc-700 px-4 py-1.5 rounded-full">
              {displayType ? (
                <Ionicons name={MEAL_ICONS[displayType] as IoniconName} size={16} color={AMBER} />
              ) : null}
              <Text className="text-amber-400 text-sm font-semibold">{typeLabel}</Text>
            </View>
          </View>
        ) : (
          <View className="h-5" />
        )}

        {/* Card de macros */}
        {isLoading ? (
          <View className="px-4 mb-4">
            <SkeletonItem className="w-full h-44 rounded-2xl" />
          </View>
        ) : detail ? (
          <MacroBreakdownCard calories={calories} proteins={proteins} carbs={carbs} fats={fats} />
        ) : null}

        {/* Error */}
        {error && !isLoading && (
          <View className="mx-4 mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl items-center">
            <Text className="text-rose-400 text-sm text-center mb-3">{error}</Text>
            <TouchableOpacity onPress={onRetry} className="bg-amber-400 px-6 py-2 rounded-xl">
              <Text className="text-zinc-900 font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ingredientes */}
        {detail && detail.recipe.ingredients.length > 0 && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl mx-4 mb-4 p-5">
            <Text className="text-white text-lg font-bold mb-1">Ingredientes</Text>
            {detail.recipe.ingredients.map((ing, idx) => (
              <View
                key={idx}
                className="flex-row items-center py-3 border-b border-zinc-800/80"
              >
                <Text className="text-amber-400 text-base font-semibold w-20">{ing.amount}</Text>
                <Text className="flex-1 text-white text-base">{ing.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Preparación */}
        {detail && steps.length > 0 && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl mx-4 mb-4 p-5">
            <Text className="text-white text-lg font-bold mb-1">Preparación</Text>
            {steps.map((step, idx) => (
              <View key={idx} className="flex-row items-center gap-3 py-3 border-b border-zinc-800/80">
                <View className="w-8 h-8 rounded-xl border border-zinc-700 items-center justify-center flex-shrink-0">
                  <Text className="text-amber-400 text-sm font-semibold">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-white text-base leading-snug">{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skeleton de contenido mientras carga */}
        {isLoading && (
          <View className="px-4 gap-3">
            <SkeletonItem className="w-full h-32 rounded-2xl" />
            <SkeletonItem className="w-full h-32 rounded-2xl" />
          </View>
        )}
      </ScrollView>

      {/* CTA fijo abajo */}
      <View className="absolute left-0 right-0 px-4" style={{ bottom: bottomOffset }}>
        {logError ? (
          <Text className="text-rose-400 text-xs text-center mb-2">{logError}</Text>
        ) : null}
        <TouchableOpacity
          onPress={onLog}
          disabled={!detail || isLogging}
          activeOpacity={0.8}
          className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={{ opacity: !detail || isLogging ? 0.4 : 1 }}
        >
          <Ionicons name="restaurant" size={20} color="#18181b" />
          <Text className="text-zinc-900 font-bold text-base">
            {isLogging ? 'Registrando...' : 'Registrar alimento'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
