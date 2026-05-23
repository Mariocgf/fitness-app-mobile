import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    Pressable,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DataManagement from '@/src/components/features/profile/DataManagement';
import { FitnessSettingsView } from '@/src/components/features/profile/FitnessSettingsView';
import { HealthSettingsView } from '@/src/components/features/profile/HealthSettingsView';
import { NutritionSettingsView } from '@/src/components/features/profile/NutritionSettingsView';
import { ProfileMenuPanel, ProfileSection } from '@/src/components/features/profile/ProfileMenuPanel';
import { getActiveModules } from '@/src/services/module.service';
import { ActiveModule } from '@/src/types/module';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState<ProfileSection>(null);
  /** Función de back de la sub-vista activa (ej: EquipmentConfig dentro de Fitness) */
  const [subBack, setSubBack] = useState<(() => void) | null>(null);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  /**
   * panelHeight anima entre dos valores:
   *  - colapsado: ~65% (panel blanco arranca debajo del email con espacio)
   *  - expandido: ~88% (cubre el avatar, deja solo la barra de nav)
   */
  const panelHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.68)).current;
  /** Opacidad del bloque avatar: visible en reposo, oculto cuando el panel sube */
  const avatarOpacity = useRef(new Animated.Value(1)).current;

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

  /** Anima el panel y el avatar al seleccionar / deseleccionar una sección */
  const handleSelectSection = (section: ProfileSection) => {
    setSubBack(null);
    setActiveSection(section);
    Animated.parallel([
      Animated.timing(panelHeight, {
        toValue: section ? SCREEN_HEIGHT * 0.88 : SCREEN_HEIGHT * 0.68,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(avatarOpacity, {
        toValue: section ? 0 : 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

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
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  const fullName = user?.fullName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  const sectionTitle: Record<NonNullable<ProfileSection>, string> = {
    fitness: 'Fitness',
    nutrition: 'Nutrición',
    health: 'Salud',
    subscription: 'Suscripción',
    settings: 'Configuración',
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'fitness':
        return (
          <FitnessSettingsView
            onBack={() => handleSelectSection(null)}
            onSubBackChange={(fn) => setSubBack(fn ? () => fn : null)}
          />
        );
      case 'nutrition':
        return <NutritionSettingsView onBack={() => handleSelectSection(null)} />;
      case 'health':
        return (
          <HealthSettingsView
            onBack={() => handleSelectSection(null)}
            onSubBackChange={(fn) => setSubBack(fn ? () => fn : null)}
          />
        );
      case 'settings':
        return <DataManagement onBack={() => handleSelectSection(null)} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* ── Header oscuro: nav bar + avatar + info (siempre debajo del panel) ── */}
      <View style={{ paddingTop: insets.top }} className="items-center px-5 bg-slate-100 dark:bg-slate-950">
        {/* Barra de navegación */}
        <View className="w-full flex-row items-center h-11 mb-5">
          <Pressable
            onPress={() => {
              if (subBack) { subBack(); }
              else if (activeSection) { handleSelectSection(null); }
              else { router.back(); }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
          >
            <Ionicons name="chevron-back" size={28} className="text-slate-900 dark:text-slate-100" />
          </Pressable>
          <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-slate-50">
            {activeSection ? sectionTitle[activeSection] : 'Perfil'}
          </Text>
          <View className="w-9" />
        </View>

        {/* Avatar + info — se oculta cuando el panel sube */}
        <Animated.View style={{ opacity: avatarOpacity }} className="w-full items-center">
        <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 mb-3">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-slate-800">
              <Text className="text-3xl font-bold text-slate-400">
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-slate-900 dark:text-white text-lg font-bold mb-0.5">{fullName}</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-0.5">Premium</Text>
        <Text className="text-slate-400 dark:text-slate-500 text-sm">{email}</Text>
        </Animated.View>
      </View>

      {/* ── Panel blanco animado — posición absoluta desde abajo ── */}
      <Animated.View
        style={{ height: panelHeight }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden bg-white dark:bg-slate-950"
      >
        <ProfileMenuPanel
          activeModules={activeModules}
          isLoadingModules={isLoadingModules}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onLogout={() => signOut()}
        >
          {renderSectionContent()}
        </ProfileMenuPanel>
        <View
          className="items-center pb-6 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Text className="text-slate-400 dark:text-slate-600 text-xs">
            v{Constants.expoConfig?.version ?? '—'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
