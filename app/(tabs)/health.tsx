import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/src/components/common/themed-text';
import { useThemeColor } from '@/src/hooks/use-theme-color';

export default function HealthScreen() {
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
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
