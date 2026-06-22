import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { forwardRef, useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Routine } from '@/src/types/routine';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const LIME = '#a3e635';

export type CardState = 'initial' | 'loading' | 'success';

interface ActionCardProps {
  cardState: CardState;
  onGenerate: () => void;
  onViewPlan: () => void;
  routine?: Routine | null;
  isLoadingInitial?: boolean;
}

/** Devuelve el nombre del día de hoy en español */
const getTodayNameSpanish = (): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
};

/** Icon-tile cuadrado con ícono de acento (lime) sobre superficie secundaria */
function AccentIconTile({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="w-16 h-16 rounded-2xl bg-zinc-800 items-center justify-center">
      <Ionicons name={name} size={30} color={LIME} />
    </View>
  );
}

/**
 * Card "Tu rutina activa" del módulo Fitness (dark-only, acento lime).
 * Tres estados: `initial` (sin rutina → generar), `loading` (generando con IA),
 * `success` (rutina activa con icon-tile, día, meta y "Continuar rutina").
 * Soporta `ref` para medir su layout y animar la expansión al detalle.
 */
export const ActionCard = forwardRef<View, ActionCardProps>(({ cardState, onGenerate, onViewPlan, routine, isLoadingInitial = false }, ref) => {
  const sparkleOpacity = useSharedValue(1);
  const sparkleScale = useSharedValue(1);

  useEffect(() => {
    if (cardState === 'loading') {
      sparkleOpacity.value = withRepeat(withTiming(0.3, { duration: 700 }), -1, true);
      sparkleScale.value = withRepeat(withTiming(1.2, { duration: 700 }), -1, true);
    } else {
      sparkleOpacity.value = withTiming(1, { duration: 300 });
      sparkleScale.value = withTiming(1, { duration: 300 });
    }
  }, [cardState]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  const firstDay = routine?.days?.[0];
  const exerciseCount = firstDay?.exercises.length ?? 0;
  const approxTime = firstDay?.approxTimeSession ?? '45 min';
  const meta = exerciseCount > 0 ? `${exerciseCount} ejercicios • ${approxTime}` : approxTime;

  return (
    <View
      ref={ref}
      collapsable={false}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mx-4"
    >
      {isLoadingInitial ? (
        <View className="flex-row items-center py-3">
          <ActivityIndicator size="small" color={LIME} />
          <Text className="text-zinc-400 ml-3">Sincronizando...</Text>
        </View>
      ) : (
        <>
          {/* Sin rutina activa */}
          {cardState === 'initial' && (
            <>
              <View className="flex-row items-center mb-5">
                <AccentIconTile name="sparkles" />
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold mb-1">Generá tu rutina</Text>
                  <Text className="text-zinc-400 text-sm leading-5">
                    Obtené tu primer plan personalizado con IA.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onGenerate}
                activeOpacity={0.85}
                className="flex-row items-center justify-center py-4 rounded-xl bg-lime-400"
              >
                <Text className="text-zinc-900 font-bold text-base mr-2">Generar rutina</Text>
                <Ionicons name="sparkles" size={18} color="#18181b" />
              </TouchableOpacity>
            </>
          )}

          {/* Generando rutina con IA */}
          {cardState === 'loading' && (
            <>
              <View className="flex-row items-center mb-5">
                <Animated.View style={animatedStyle}>
                  <AccentIconTile name="sparkles" />
                </Animated.View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold mb-1">Generando rutina</Text>
                  <Text className="text-zinc-400 text-sm leading-5">
                    Analizando tus preferencias con IA...
                  </Text>
                </View>
              </View>
              <View className="py-4 rounded-xl items-center bg-lime-400 opacity-50">
                <ActivityIndicator size="small" color="#18181b" />
              </View>
            </>
          )}

          {/* Rutina activa */}
          {cardState === 'success' && routine && (
            <>
              <View className="flex-row items-center mb-5">
                <AccentIconTile name={routine.source === 'Manual' ? 'barbell' : 'fitness'} />
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold mb-1" numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="calendar-outline" size={14} color="#71717a" />
                    <Text className="text-zinc-400 text-sm ml-1.5">{getTodayNameSpanish()}</Text>
                  </View>
                  <Text className="text-zinc-400 text-sm">{meta}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onViewPlan}
                activeOpacity={0.85}
                className="flex-row items-center justify-center py-4 rounded-xl bg-lime-400"
              >
                <Text className="text-zinc-900 font-bold text-base mr-2">Continuar rutina</Text>
                <Ionicons name="arrow-forward" size={18} color="#18181b" />
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </View>
  );
});

ActionCard.displayName = 'ActionCard';
