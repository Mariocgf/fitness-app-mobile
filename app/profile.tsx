import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import DataManagement from '@/src/components/features/profile/DataManagement';
import DietaryConfig from '@/src/components/features/profile/DietaryConfig';
import EquipmentConfig from '@/src/components/features/profile/EquipmentConfig';
import InjuriesConfig from '@/src/components/features/profile/InjuriesConfig';
import ProfileHeader from '@/src/components/features/profile/ProfileHeader';
import { SettingsSection } from '@/src/components/features/profile/SettingsSection';
import { getActiveModules } from '@/src/services/module.service';
import { ActiveModule } from '@/src/types/module';

/** Pantallas internas del perfil */
type ProfileScreenType = 'main' | 'equipment' | 'injuries' | 'dietary' | 'data';

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [activeScreen, setActiveScreen] = useState<ProfileScreenType>('main');
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  // ── Cargar módulos activos ──
  useEffect(() => {
    const fetchModules = async () => {
      try {
        // 1. Cache-First (carga optimista)
        const cachedModulesStr = await AsyncStorage.getItem('@active_modules');
        if (cachedModulesStr) {
          const cachedModules = JSON.parse(cachedModulesStr);
          setActiveModules(Array.isArray(cachedModules) ? cachedModules : []);
          setIsLoadingModules(false);
        }

        // 2. Fetch en segundo plano
        const token = await getToken();
        const modules = await getActiveModules(token);
        const validModules = Array.isArray(modules) ? modules : [];
        
        setActiveModules(validModules);
        await AsyncStorage.setItem('@active_modules', JSON.stringify(validModules));
      } catch (e) {
        console.error('Error cargando módulos activos:', e);
      } finally {
        setIsLoadingModules(false);
      }
    };
    if (isLoaded) fetchModules();
  }, [isLoaded]);

  // ── Handlers ──
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

  // ── Estado de carga ──
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

        {/* Sección de configuración extraída a componente */}
        <SettingsSection
          activeModules={activeModules}
          isLoadingModules={isLoadingModules}
          onNavigate={(screen) => setActiveScreen(screen as ProfileScreenType)}
        />
      </ScrollView>
    </View>
  );
}
