import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Module } from '@/src/types/user';

interface ModuleSelectionStepProps {
  modules: Module[];
  selectedModuleIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onContinue: () => void;
  isSubmitting: boolean;
  isLoading: boolean;
}

/**
 * Paso de selección de módulos del onboarding.
 * Muestra tarjetas visuales con imagen de fondo para cada módulo + opción "Experiencia completa".
 */
export default function ModuleSelectionStep({
  modules,
  selectedModuleIds,
  onSelectionChange,
  onContinue,
  isSubmitting,
  isLoading,
}: ModuleSelectionStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const allModuleIds = useMemo(() => modules.map((m) => m.id), [modules]);
  const isAllSelected =
    modules.length > 0 && allModuleIds.every((id) => selectedModuleIds.includes(id));

  const toggleModule = (moduleId: string) => {
    if (selectedModuleIds.includes(moduleId)) {
      onSelectionChange(selectedModuleIds.filter((id) => id !== moduleId));
    } else {
      onSelectionChange([...selectedModuleIds, moduleId]);
    }
  };

  const toggleAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...allModuleIds]);
    }
  };

  const handleContinue = () => {
    if (selectedModuleIds.length === 0) {
      alert('Por favor selecciona al menos un módulo.');
      return;
    }
    onContinue();
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="px-8"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 pt-8">
        <Text className="text-[34px] font-bold text-slate-900 dark:text-white">
          Modulos
        </Text>
        <Text className="text-lg text-slate-500 dark:text-zinc-400 mb-8">
          Personaliza la experiencia
        </Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#00c2e0" />
            <Text className="text-slate-500 dark:text-zinc-400 mt-4">
              Cargando módulos...
            </Text>
          </View>
        ) : (
          <View className="gap-4 ">
            {/* Tarjetas de módulos individuales */}
            {modules.map((module) => {
              const isSelected = selectedModuleIds.includes(module.id);

              return (
                <TouchableOpacity
                  key={module.id}
                  onPress={() => toggleModule(module.id)}
                  activeOpacity={0.85}
                  className={`rounded-2xl overflow-hidden border-2 ${
                    isSelected
                      ? 'border-[#00c2e0]'
                      : 'border-transparent'
                  }`}
                  style={{
                    height: 100,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  {/* Imagen de fondo */}
                  <Image
                    source={{ uri: module.imageUrl }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                    }}
                    contentFit="cover"
                    transition={300}
                  />

                  {/* Gradiente oscuro para legibilidad del texto */}
                  <View
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                  />

                  {/* Contenido */}
                  <View className="flex-1 justify-center px-5">
                    <Text className="text-white text-lg font-bold">
                      {module.name}
                    </Text>
                    <Text className="text-white/80 text-sm mt-0.5">
                      {module.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Opción "Experiencia completa" (frontend-only) */}
            {modules.length > 0 && (
              <TouchableOpacity
                onPress={toggleAll}
                activeOpacity={0.85}
                className={`rounded-2xl overflow-hidden border-2 ${
                  isAllSelected
                    ? 'border-[#00c2e0]'
                    : 'border-transparent'
                }`}
                style={{
                  height: 100,
                  shadowColor: '#00c2e0',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Imagen de fondo */}
                <Image
                  source={{ uri: 'https://res.cloudinary.com/dtyfqh3ip/image/upload/v1777030694/all_bryaa9.webp' }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                  }}
                  contentFit="cover"
                  transition={300}
                />

                {/* Gradiente oscuro para legibilidad del texto */}
                <View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  }}
                />

                <View className="flex-1 justify-center px-5">
                  <Text className="text-white text-lg font-bold">
                    Experiencia completa
                  </Text>
                  <Text className="text-white/80 text-sm mt-0.5">
                    Acceso total a todos los módulos.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View className="items-center mb-[34px] mt-8">
        <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-8 px-6 leading-5">
          Podrás añadir o quitar módulos en cualquier momento desde tu perfil.
        </Text>

        <TouchableOpacity
          className="w-full bg-[#00c2e0] py-5 rounded-2xl items-center shadow-md"
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">
            Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
