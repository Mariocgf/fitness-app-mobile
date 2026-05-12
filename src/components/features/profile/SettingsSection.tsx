import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ConfigMenuItem from '@/src/components/features/profile/ConfigMenuItem';
import { ActiveModule } from '@/src/types/module';

/** Sección de configuración del perfil con opciones dinámicas según módulos activos */

interface SettingsSectionProps {
  activeModules: ActiveModule[];
  isLoadingModules: boolean;
  onNavigate: (screen: string) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  activeModules,
  isLoadingModules,
  onNavigate,
}) => {
  /** Verifica si un módulo específico está activo */
  const hasModule = (name: string) =>
    activeModules.some(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    );

  return (
    <View className="mt-7 px-5">
      <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
        Configuración
      </Text>

      <View className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        {/* Módulos dinámicos */}
        {isLoadingModules ? (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#06b6d4" />
          </View>
        ) : (
          <>
            {hasModule('Fitness') && (
              <ConfigMenuItem
                icon="barbell-outline"
                label="Equipamientos"
                onPress={() => onNavigate('equipment')}
              />
            )}
            {hasModule('Health') && (
              <ConfigMenuItem
                icon="body-outline"
                label="Limitaciones físicas"
                onPress={() => onNavigate('injuries')}
              />
            )}
            {hasModule('Nutrition') && (
              <ConfigMenuItem
                icon="restaurant-outline"
                label="Restricciones alimenticias"
                onPress={() => onNavigate('dietary')}
              />
            )}
          </>
        )}

        {/* Siempre visible */}
        <ConfigMenuItem
          icon="settings-outline"
          label="Manejo de datos"
          onPress={() => onNavigate('data')}
        />
      </View>
    </View>
  );
};
