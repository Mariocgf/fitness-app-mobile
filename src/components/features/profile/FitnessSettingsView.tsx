import { ProfileModuleCard } from '@/src/components/features/profile/ProfileModuleCard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Lista de sub-opciones del módulo Fitness dentro del perfil.
 * Cards `ProfileModuleCard` (icon-tile + título), mismo lenguaje visual que la
 * raíz del Perfil. Cada item navega a su ruta real (`/profile/fitness-*`).
 */
export const FitnessSettingsView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileModuleCard
          icon="barbell-outline"
          title="Equipamiento"
          onPress={() => router.push('/profile/fitness-equipment')}
        />
        <ProfileModuleCard
          icon="calendar-outline"
          title="Días y duración"
          onPress={() => router.push('/profile/fitness-training')}
        />
        <ProfileModuleCard
          icon="flag-outline"
          title="Sub objetivo"
          onPress={() => router.push('/profile/fitness-subgoal')}
        />
        <ProfileModuleCard
          icon="heart-outline"
          title="Ejercicios favoritos"
          onPress={() => Alert.alert('Ejercicios favoritos', 'Próximamente.')}
        />
        <ProfileModuleCard
          icon="ban-outline"
          title="Ejercicios no deseados"
          onPress={() => Alert.alert('Ejercicios no deseados', 'Próximamente.')}
        />
      </ScrollView>
    </View>
  );
};
