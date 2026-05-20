import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/**
 * Card placeholder para el módulo de Nutrición en la pantalla Home.
 * La funcionalidad de generación de dieta se habilitará en una versión futura.
 */
export function DietCard() {

  const handlePress = () => {
    Alert.alert('Próximamente', 'La generación de dieta personalizada estará disponible pronto.');
  };

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mx-4 mt-3">
      <View className="flex-row items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
            Genera tu dieta
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 leading-5">
            No tienes planes activos.{'\n'}Obtén tu primera dieta personalizada ahora.
          </Text>
        </View>
        <Ionicons name="sparkles" size={40} className="text-slate-900 dark:text-slate-50" />
      </View>

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="py-4 rounded-xl items-center bg-amber-400"
      >
        <Text className="text-white font-bold text-base">Generar dieta</Text>
      </TouchableOpacity>
    </View>
  );
}
