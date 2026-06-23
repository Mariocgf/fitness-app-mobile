import { ProfileModuleCard } from '@/src/components/features/profile/ProfileModuleCard';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Lista de sub-opciones del módulo Salud dentro del perfil.
 * Cards `ProfileModuleCard` (icon-tile + título), mismo lenguaje visual que la
 * raíz del Perfil. Cada item navega a su ruta real (`/profile/health-*`).
 */
export const HealthSettingsView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileModuleCard
          icon="bandage-outline"
          title="Lesiones"
          onPress={() => router.push('/profile/health-injuries')}
        />
        <ProfileModuleCard
          icon="medkit-outline"
          title="Afecciones médicas"
          onPress={() => router.push('/profile/health-conditions')}
        />
      </ScrollView>
    </View>
  );
};
