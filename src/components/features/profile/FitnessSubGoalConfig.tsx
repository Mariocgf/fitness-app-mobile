import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/src/components/ui/feedback';
import CheckableCard from '@/src/components/common/CheckableCard';
import SectionCard from '@/src/components/common/SectionCard';
import { useUnsavedChangesGuard } from '@/src/hooks/useUnsavedChangesGuard';
import {
  getFitnessSubGoal,
  getSubGoals,
  updateFitnessSubGoal,
} from '@/src/services/fitness.service';
import { getModules } from '@/src/services/onboarding.service';
import { SubGoal } from '@/src/types/fitness';

interface FitnessSubGoalConfigProps {
  /** Vuelve a la lista del módulo tras guardar (la ruta lo cablea a `router.back()`) */
  onBack: () => void;
}

/**
 * Sub-pantalla para editar el subobjetivo principal de Fitness (ruta `/profile/fitness-subgoal`).
 */
export default function FitnessSubGoalConfig({ onBack }: FitnessSubGoalConfigProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const insets = useSafeAreaInsets();

  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [selectedSubGoalId, setSelectedSubGoalId] = useState<string | null>(null);
  const [initialSubGoalId, setInitialSubGoalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getTokenRef.current();
        const modules = await getModules(token);
        const fitnessModule = modules.find(
          (module) => module.name.toLowerCase() === 'fitness'
        );

        if (!fitnessModule) {
          throw new Error('No se encontró el módulo Fitness.');
        }

        const [currentSubGoal, availableSubGoals] = await Promise.all([
          getFitnessSubGoal(token),
          getSubGoals(fitnessModule.id, token),
        ]);

        const currentId = currentSubGoal?.subGoalId ?? null;
        setSelectedSubGoalId(currentId);
        setInitialSubGoalId(currentId);
        setSubGoals(Array.isArray(availableSubGoals) ? availableSubGoals : []);
      } catch (error) {
        logger.error('Error cargando subobjetivo de fitness:', error);
        toast.error('No se pudo cargar el subobjetivo de Fitness.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const hasChanges = useMemo(
    () => selectedSubGoalId !== initialSubGoalId,
    [selectedSubGoalId, initialSubGoalId]
  );

  useUnsavedChangesGuard(
    hasChanges,
    'Tu cambio de subobjetivo no se guardó. ¿Querés salir de todas formas?'
  );

  const handleSave = async () => {
    if (!selectedSubGoalId) {
      toast.warning('Seleccioná un subobjetivo para Fitness.', { title: 'Falta información' });
      return;
    }

    setIsSaving(true);
    try {
      const token = await getTokenRef.current();
      await updateFitnessSubGoal({ subGoalId: selectedSubGoalId }, token);
      setInitialSubGoalId(selectedSubGoalId);
      toast.success('Subobjetivo de Fitness actualizado correctamente.');
      onBack();
    } catch (error) {
      logger.error('Error guardando subobjetivo de fitness:', error);
      toast.error('No se pudo actualizar el subobjetivo de Fitness.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#a1a1aa" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <SectionCard
          icon={<Ionicons name="ribbon-outline" size={20} className="text-zinc-400" />}
          title="Sub objetivo"
          subtitle="Elegí tu enfoque principal"
        >
          {subGoals.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-sm text-zinc-400 text-center">
                No hay subobjetivos disponibles para Fitness.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {subGoals.map((goal) => (
                <CheckableCard
                  key={goal.id}
                  isSelected={selectedSubGoalId === goal.id}
                  label={goal.name}
                  description={goal.description}
                  onPress={() => setSelectedSubGoalId(goal.id)}
                />
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>

      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 8 }}
        className="px-4 pt-3 bg-zinc-950"
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || subGoals.length === 0}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-zinc-50"
          style={{ opacity: isSaving || subGoals.length === 0 ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-zinc-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
