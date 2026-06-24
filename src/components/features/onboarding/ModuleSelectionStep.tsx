import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { Module } from '@/src/types/user';

/** Degradado de las tarjetas: #0F172B opaco al 0% → #334E91 al 25% de opacidad al 100% */
const CARD_GRADIENT_COLORS = ['#0F172B', 'rgba(51,78,145,0.25)'] as const;
const CARD_GRADIENT_LOCATIONS = [0, 1] as const;

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
 * Dark-only zinc neutro, alineado al chrome de los pasos 1/2/3 (header centrado,
 * footer con helper info). Las tarjetas con imagen y degradado #0F172B →
 * transparente se mantienen sin cambios (decisión del usuario).
 */
export default function ModuleSelectionStep({
  modules,
  selectedModuleIds,
  onSelectionChange,
  onContinue,
  isSubmitting,
  isLoading,
}: ModuleSelectionStepProps) {
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

  /** Iconos para cada módulo según su nombre */
  const getModuleIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'fitness':
        return 'barbell-outline';
      case 'nutrición':
      case 'nutrition':
        return 'nutrition-outline';
      case 'salud':
      case 'health':
        return 'heart-outline';
      default:
        return 'star-outline';
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Indicador de progreso original (no los círculos numerados de la maqueta) */}
      <ProgressBar currentStep={0} totalSteps={1} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-6">
          <OnboardingHeader
            title="Elige tu enfoque"
            subtitle="Personaliza tu experiencia Wellium."
            centered
          />

          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#a1a1aa" />
              <Text className="text-zinc-400 mt-4">
                Cargando módulos...
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {/* Tarjetas de módulos individuales */}
              {modules.map((module) => {
                const isSelected = selectedModuleIds.includes(module.id);

                return (
                  <ModuleCard
                    key={module.id}
                    imageUri={module.imageUrl}
                    iconName={getModuleIcon(module.name) as any}
                    name={module.name}
                    description={module.description}
                    isSelected={isSelected}
                    onPress={() => toggleModule(module.id)}
                  />
                );
              })}

              {/* Opción "Todo incluido" (frontend-only) */}
              {modules.length > 0 && (
                <ModuleCard
                  imageUri="https://res.cloudinary.com/dtyfqh3ip/image/upload/v1777030694/all_bryaa9.webp"
                  iconName="star-outline"
                  name="Todo incluido"
                  description="Acceso total a todos los módulos."
                  isSelected={isAllSelected}
                  onPress={toggleAll}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={handleContinue}
        disabled={selectedModuleIds.length === 0 || isLoading}
        buttonLabel="Continuar"
        helperText="Podrás añadir o quitar módulos en cualquier momento desde tu perfil."
        helperIcon={
          <View className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
            <Ionicons name="information-circle-outline" size={20} color="#a1a1aa" />
          </View>
        }
      />
    </View>
  );
}

/** Props internas de la tarjeta de módulo */
interface ModuleCardProps {
  imageUri: string;
  iconName: string;
  name: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Tarjeta reutilizable para cada módulo en la pantalla de selección.
 * Imagen de fondo a la derecha, degradado oscuro sobre el contenido a la izquierda.
 */
function ModuleCard({ imageUri, iconName, name, description, isSelected, onPress }: ModuleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="rounded-2xl overflow-hidden"
      style={{ height: 100 }}
    >
      {/* Imagen de fondo */}
      <Image
        source={{ uri: imageUri }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
      />

      {/* Degradado oscuro de izquierda a transparente */}
      <LinearGradient
        colors={CARD_GRADIENT_COLORS}
        locations={CARD_GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Contenido: Icono + Texto + Checkmark */}
      <View className="flex-1 flex-row items-center px-5 py-4">
        {/* Icono en círculo semitransparente */}
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
          <Ionicons name={iconName as any} size={24} color="#ffffff" />
        </View>

        {/* Texto */}
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{name}</Text>
          <Text className="text-white/75 text-sm mt-0.5">{description}</Text>
        </View>

        {/* Checkmark */}
        <View className={`w-8 h-8 rounded-full items-center justify-center ${
          isSelected ? 'bg-white' : 'border-2 border-white/50'
        }`}>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color="#0F172B" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
