import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface DraftCardProps {
  draft: { name: string; days: { id: string }[] };
  onContinue: () => void;
  onDiscard: () => void;
}

/**
 * Card "Rutina en creación" del tab de Fitness: muestra el borrador de rutina
 * pendiente (nombre + cantidad de días) con un ícono pulsante y acciones para
 * seguir creando o descartar. Presentacional puro.
 */
export function DraftCard({ draft, onContinue, onDiscard }: DraftCardProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const subtitle = draft.name.trim()
    ? `"${draft.name}" · ${draft.days.length} ${draft.days.length === 1 ? 'día' : 'días'}`
    : `${draft.days.length} ${draft.days.length === 1 ? 'día cargado' : 'días cargados'}`;

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mx-4">
      <View className="flex-row items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-white text-xl font-bold mb-1">
            Rutina en creación
          </Text>
          <Text className="text-zinc-400 leading-5">
            {subtitle}
          </Text>
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="create-outline" size={36} color="#a3e635" />
        </Animated.View>
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.85}
          className="flex-1 py-4 rounded-xl items-center bg-lime-400"
        >
          <Text className="text-zinc-900 font-bold text-base">Seguir creando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDiscard}
          activeOpacity={0.85}
          className="px-4 rounded-xl items-center justify-center bg-zinc-800"
        >
          <Ionicons name="trash-outline" size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
