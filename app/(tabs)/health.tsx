import { ThemedText } from '@/src/components/common/themed-text';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HealthScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <View className="flex-1 items-center justify-center px-6">
        <ThemedText type="title" className="text-2xl font-bold mb-2">
          Salud
        </ThemedText>
        <ThemedText type="default" className="text-gray-500 text-center">
          Próximamente: métricas de salud y consultas.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}
