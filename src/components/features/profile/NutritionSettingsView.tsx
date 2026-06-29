import { ProfileModuleCard } from '@/src/components/features/profile/ProfileModuleCard';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/src/components/ui/feedback';

/**
 * Lista de sub-opciones del módulo Nutrición dentro del perfil.
 * Cards `ProfileModuleCard` (icon-tile + título), mismo lenguaje visual que la
 * raíz del Perfil. Cada item navega a su ruta real (`/profile/nutrition-*`).
 */
export const NutritionSettingsView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileModuleCard
          icon="flag-outline"
          title="Sub objetivo"
          onPress={() => toast.info('Próximamente.')}
        />
        <ProfileModuleCard
          icon="alert-circle-outline"
          title="Alergias alimenticias"
          onPress={() => toast.info('Próximamente.')}
        />
        <ProfileModuleCard
          icon="restaurant-outline"
          title="Estilo de dieta"
          onPress={() => router.push('/profile/nutrition-dietary')}
        />
      </ScrollView>
    </View>
  );
};
