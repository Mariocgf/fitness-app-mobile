import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import ConfigMenuItem from '@/src/components/features/profile/ConfigMenuItem';
import DataManagement from '@/src/components/features/profile/DataManagement';
import DietaryConfig from '@/src/components/features/profile/DietaryConfig';
import EquipmentConfig from '@/src/components/features/profile/EquipmentConfig';
import InjuriesConfig from '@/src/components/features/profile/InjuriesConfig';
import ProfileHeader from '@/src/components/features/profile/ProfileHeader';
import { getActiveModules } from '@/src/services/module.service';
import { ActiveModule } from '@/src/types/module';

/** Pantallas internas del perfil */
type ProfileScreen = 'main' | 'equipment' | 'injuries' | 'dietary' | 'data';

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeScreen, setActiveScreen] = useState<ProfileScreen>('main');
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  // ── Cargar módulos activos ──
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const token = await getToken();
        const modules = await getActiveModules(token);
        setActiveModules(Array.isArray(modules) ? modules : []);
      } catch (e) {
        console.error('Error cargando módulos activos:', e);
      } finally {
        setIsLoadingModules(false);
      }
    };
    if (isLoaded) fetchModules();
  }, [isLoaded]);

  // ── Helpers ──
  const hasModule = (name: string) =>
    activeModules.some(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    );

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          // Limpiar flags locales y borradores para que un usuario nuevo no se salte el onboarding
          await AsyncStorage.multiRemove([
            '@onboarding_completed',
            '@onboarding_draft',
            '@onboarding_selected_modules',
            '@onboarding_health_config',
            '@onboarding_fitness_config',
            '@onboarding_nutrition_config',
            '@onboarding_module_config_step'
          ]);
          signOut();
        },
      },
    ]);
  };

  // ── Loading state ──
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  // ── Sub-pantallas de configuración ──
  if (activeScreen === 'equipment') {
    return <EquipmentConfig onBack={() => setActiveScreen('main')} />;
  }
  if (activeScreen === 'injuries') {
    return <InjuriesConfig onBack={() => setActiveScreen('main')} />;
  }
  if (activeScreen === 'dietary') {
    return <DietaryConfig onBack={() => setActiveScreen('main')} />;
  }
  if (activeScreen === 'data') {
    return <DataManagement onBack={() => setActiveScreen('main')} />;
  }

  // ── Datos del usuario ──
  const fullName = user?.fullName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  // ── Pantalla principal del perfil ──
  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con avatar + card blur */}
        <ProfileHeader
          avatarUrl={avatarUrl}
          fullName={fullName}
          email={email}
          onLogout={handleSignOut}
        />

        {/* Sección de configuración */}
        <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDark ? '#fafafa' : '#0f172a',
              marginBottom: 16,
            }}
          >
            Configuración
          </Text>

          <View
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              // Sombra sutil
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Módulos dinámicos */}
            {isLoadingModules ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#06b6d4" />
              </View>
            ) : (
              <>
                {hasModule('Fitness') && (
                  <ConfigMenuItem
                    icon="barbell-outline"
                    label="Equipamientos"
                    onPress={() => setActiveScreen('equipment')}
                  />
                )}
                {hasModule('Health') && (
                  <ConfigMenuItem
                    icon="body-outline"
                    label="Limitaciones físicas"
                    onPress={() => setActiveScreen('injuries')}
                  />
                )}
                {hasModule('Nutrition') && (
                  <ConfigMenuItem
                    icon="restaurant-outline"
                    label="Restricciones alimenticias"
                    onPress={() => setActiveScreen('dietary')}
                  />
                )}
              </>
            )}

            {/* Siempre visible */}
            <ConfigMenuItem
              icon="settings-outline"
              label="Manejo de datos"
              onPress={() => setActiveScreen('data')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
