import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileIdentityHeader } from '@/src/components/features/profile/ProfileIdentityHeader';
import { ProfileModuleCard } from '@/src/components/features/profile/ProfileModuleCard';
import { getActiveModules } from '@/src/services/module.service';
import { ActiveModule } from '@/src/types/module';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  // ── Cargar módulos activos ──
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const cachedModulesStr = await AsyncStorage.getItem('@active_modules');
        if (cachedModulesStr) {
          const cached = JSON.parse(cachedModulesStr);
          setActiveModules(Array.isArray(cached) ? cached : []);
          setIsLoadingModules(false);
        }
        const token = await getToken();
        const modules = await getActiveModules(token);
        const valid = Array.isArray(modules) ? modules : [];
        setActiveModules(valid);
        await AsyncStorage.setItem('@active_modules', JSON.stringify(valid));
      } catch (e) {
        console.error('Error cargando módulos activos:', e);
      } finally {
        setIsLoadingModules(false);
      }
    };
    if (isLoaded) fetchModules();
  }, [isLoaded]);

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            '@onboarding_completed',
            '@onboarding_draft',
            '@onboarding_selected_modules',
            '@onboarding_health_config',
            '@onboarding_fitness_config',
            '@onboarding_nutrition_config',
            '@onboarding_module_config_step',
          ]);
          signOut();
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#f4f4f5" />
      </View>
    );
  }

  const fullName = user?.fullName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  const hasModule = (name: string) =>
    activeModules.some((m) => m.name.toLowerCase() === name.toLowerCase());
  const hasAnyModule =
    !isLoadingModules && (hasModule('Fitness') || hasModule('Nutrition') || hasModule('Health'));

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
      >
        {/* Back + título grande (misma fila) */}
        <View className="flex-row items-center px-4 mb-5">
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full border border-zinc-700 items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Ionicons name="chevron-back" size={20} className="text-zinc-100" />
          </Pressable>
          <Text className="ml-3 text-3xl font-bold text-white">Perfil</Text>
        </View>

        {/* Identidad */}
        <ProfileIdentityHeader fullName={fullName} email={email} avatarUrl={avatarUrl} plan="Premium" />

        {/* Cuenta */}
        <Text className="px-5 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Cuenta
        </Text>
        <ProfileModuleCard
          icon="diamond-outline"
          title="Suscripción"
          subtitle="Plan Premium activo"
          onPress={() => Alert.alert('Suscripción', 'Próximamente.')}
        />

        {/* Mis módulos — solo módulos activos */}
        {hasAnyModule && (
          <Text className="px-5 mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Mis módulos
          </Text>
        )}
        {hasModule('Fitness') ? (
          <ProfileModuleCard
            icon="barbell-outline"
            title="Fitness"
            bullets={['Equipamiento', 'Días y duración', 'Sub objetivo']}
            onPress={() => router.push('/profile/fitness')}
          />
        ) : null}
        {hasModule('Nutrition') ? (
          <ProfileModuleCard
            icon="restaurant-outline"
            title="Nutrición"
            bullets={['Sub objetivo', 'Alergias alimenticias', 'Estilo de dieta']}
            onPress={() => router.push('/profile/nutrition')}
          />
        ) : null}
        {hasModule('Health') ? (
          <ProfileModuleCard
            icon="heart-outline"
            title="Salud"
            bullets={['Lesiones', 'Afecciones médicas']}
            onPress={() => router.push('/profile/health')}
          />
        ) : null}

        {/* Configuración */}
        <ProfileModuleCard
          icon="settings-outline"
          title="Configuración"
          subtitle="Ajustes de la aplicación"
          onPress={() => router.push('/profile/settings')}
        />

        {/* Cerrar sesión */}
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center justify-center mx-5 mt-4 py-4 rounded-2xl border border-red-500/50"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text className="ml-2 text-base font-semibold text-red-400">Cerrar sesión</Text>
        </Pressable>

        {/* Versión */}
        <Text className="mt-5 text-center text-sm text-zinc-500">
          Versión {Constants.expoConfig?.version ?? '—'}
        </Text>
      </ScrollView>
    </View>
  );
}
