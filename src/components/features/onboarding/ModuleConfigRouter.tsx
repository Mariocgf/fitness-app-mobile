import React from 'react';
import { Text, View } from 'react-native';
import { Module } from '@/src/types/user';
import HealthConfigStep from './HealthConfigStep';
import FitnessConfigStep from './FitnessConfigStep';
import NutritionConfigStep from './NutritionConfigStep';

interface ModuleConfigRouterProps {
  /** Módulos activos que necesitan configuración, en orden */
  activeModules: Module[];
  /** Índice del módulo que se está configurando actualmente */
  currentConfigIndex: number;
  /** Callback cuando el módulo actual termina su configuración */
  onModuleConfigured: () => void;
  /** Estado de envío al backend */
  isSubmitting: boolean;
  /** Setter para controlar el estado de envío */
  setIsSubmitting: (v: boolean) => void;
  /** Nombre del objetivo global seleccionado (para Nutrition) */
  globalGoalName: string;
}

/**
 * Orquestador que renderiza el componente de configuración correcto
 * según el módulo actual.
 */
export default function ModuleConfigRouter({
  activeModules,
  currentConfigIndex,
  onModuleConfigured,
  isSubmitting,
  setIsSubmitting,
  globalGoalName,
}: ModuleConfigRouterProps) {
  // Si ya no quedan módulos por configurar
  if (currentConfigIndex >= activeModules.length) {
    return (
      <View className="flex-1 items-center justify-center px-10">
        <Text className="text-2xl font-bold text-white text-center">
          ¡Configuración completa!
        </Text>
        <Text className="text-lg text-zinc-400 text-center mt-4">
          Todos tus módulos han sido configurados.
        </Text>
      </View>
    );
  }

  const currentModule = activeModules[currentConfigIndex];

  // Renderizar el componente de configuración según el módulo
  switch (currentModule.name) {
    case 'Health':
      return (
        <HealthConfigStep
          brandColor={currentModule.brandColor}
          onComplete={onModuleConfigured}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      );

    case 'Nutrition':
      return (
        <NutritionConfigStep
          brandColor={currentModule.brandColor}
          moduleId={currentModule.id}
          globalGoalName={globalGoalName}
          onComplete={onModuleConfigured}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      );

    case 'Fitness':
      return (
        <FitnessConfigStep
          brandColor={currentModule.brandColor}
          moduleId={currentModule.id}
          globalGoalName={globalGoalName}
          onComplete={onModuleConfigured}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      );

    default:
      // Módulo sin configuración específica → avanzar automáticamente
      return (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-2xl font-bold text-white text-center">
            {currentModule.name}
          </Text>
          <Text className="text-lg text-zinc-400 text-center mt-4">
            Próximamente: Configuración personalizada.
          </Text>
        </View>
      );
  }
}
