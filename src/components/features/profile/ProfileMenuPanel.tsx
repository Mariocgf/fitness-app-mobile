import { ActiveModule } from '@/src/types/module';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/** Identificador de la sección activa dentro del panel */
export type ProfileSection =
  | null
  | 'fitness'
  | 'nutrition'
  | 'health'
  | 'subscription'
  | 'settings';

interface ProfileMenuPanelProps {
  activeModules: ActiveModule[];
  isLoadingModules: boolean;
  activeSection: ProfileSection;
  onSelectSection: (section: ProfileSection) => void;
  onLogout: () => void;
  children?: React.ReactNode;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const LogoutItem: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    className="flex-row items-center px-4 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"
  >
    <View className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mr-4">
      <Ionicons name="log-out-outline" size={20} className="text-red-400" />
    </View>
    <Text className="flex-1 text-base text-red-400">
      Cerrar sesión
    </Text>
  </TouchableOpacity>
);

/** Ítem de menú — fondo slate-100 / dark slate-800, texto slate-900 / dark slate-50 */
const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    className="flex-row items-center px-4 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"
  >
    <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-4">
      <Ionicons name={icon} size={20} className="text-slate-500 dark:text-slate-400" />
    </View>
    <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={18} className="text-slate-600 dark:text-slate-400" />
  </TouchableOpacity>
);

/**
 * Panel blanco fijo del perfil.
 * Fondo blanco, items con fondo slate-100.
 * Suscripción y Configuración van solos; Fitness/Nutrición/Salud agrupados.
 * No hay animación de posición — el panel ocupa su espacio fijo siempre.
 */
export const ProfileMenuPanel: React.FC<ProfileMenuPanelProps> = ({
  activeModules,
  isLoadingModules,
  activeSection,
  onSelectSection,
  onLogout,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const hasModule = (name: string) =>
    activeModules.some((m) => m.name.toLowerCase() === name.toLowerCase());

  const hasAnyModule =
    !isLoadingModules &&
    (hasModule('Fitness') || hasModule('Nutrition') || hasModule('Health'));

  return (
    <View className="flex-1 rounded-t-[28px] overflow-hidden bg-white dark:bg-slate-950">
      {activeSection ? (
        <View className="flex-1">{children}</View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            gap: 10,
          }}
        >
          {/* Suscripción — sola */}
          <MenuItem icon="card-outline" label="Suscripción" onPress={() => onSelectSection('subscription')} />

          {/* Fitness / Nutrición / Salud — bloque unido */}
          {hasAnyModule && (
            <View className="rounded-2xl overflow-hidden">
              {hasModule('Fitness') && (
                <TouchableOpacity
                  onPress={() => onSelectSection('fitness')}
                  activeOpacity={0.6}
                  className={`flex-row items-center px-4 py-4 bg-slate-100 dark:bg-slate-800 ${hasModule('Nutrition') || hasModule('Health') ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-4">
                    <Ionicons name="fitness-outline" size={20} className="text-slate-500 dark:text-slate-400" />
                  </View>
                  <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">Fitness</Text>
                  <Ionicons name="chevron-forward" size={18} className="text-slate-600 dark:text-slate-400" />
                </TouchableOpacity>
              )}
              {hasModule('Nutrition') && (
                <TouchableOpacity
                  onPress={() => onSelectSection('nutrition')}
                  activeOpacity={0.6}
                  className={`flex-row items-center px-4 py-4 bg-slate-100 dark:bg-slate-800 ${hasModule('Health') ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-4">
                    <Ionicons name="nutrition-outline" size={20} className="text-slate-500 dark:text-slate-400" />
                  </View>
                  <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">Nutrición</Text>
                  <Ionicons name="chevron-forward" size={18} className="text-slate-600 dark:text-slate-400" />
                </TouchableOpacity>
              )}
              {hasModule('Health') && (
                <TouchableOpacity
                  onPress={() => onSelectSection('health')}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-4 bg-slate-100 dark:bg-slate-800"
                >
                  <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-4">
                    <Ionicons name="heart-outline" size={20} className="text-slate-500 dark:text-slate-400" />
                  </View>
                  <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">Salud</Text>
                  <Ionicons name="chevron-forward" size={18} className="text-slate-600 dark:text-slate-400" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Configuración — sola */}
          <MenuItem icon="settings-outline" label="Configuración" onPress={() => onSelectSection('settings')} />

          {/* Logout */}
          <LogoutItem onPress={onLogout} />
        </ScrollView>
      )}
    </View>
  );
};
