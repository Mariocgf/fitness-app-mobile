import { logger } from '@/src/utils/logger';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
  getEquipments,
  getSubGoals,
  submitFitnessProfile,
} from '@/src/services/fitness.service';
import { Equipment, EquipmentSelection, SubGoal } from '@/src/types/fitness';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

interface UseFitnessConfigStepArgs {
  /** ID del módulo actual (para obtener los sub-objetivos) */
  moduleId: string;
  /** Callback al finalizar toda la configuración de Fitness */
  onComplete: () => void;
  /** Setter para controlar el estado de envío desde el padre */
  setIsSubmitting: (v: boolean) => void;
}

/**
 * Estado y lógica del wizard de configuración de Fitness del onboarding
 * (`FitnessConfigStep`): 4 sub-pasos con su estado, restauración/auto-guardado
 * del draft local, carga de sub-objetivos y equipamiento, y envío al backend.
 * El componente solo consume estos valores para renderizar cada pantalla.
 */
export function useFitnessConfigStep({
  moduleId,
  onComplete,
  setIsSubmitting,
}: UseFitnessConfigStepArgs) {
  const { getToken } = useAuth();
  const { saveFitnessConfig, loadFitnessConfig } = useModuleConfigStorage();

  // Sub-paso interno
  const [subStep, setSubStep] = useState(0);

  // ── Estado pantalla 0 ──
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [trainingHistory, setTrainingHistory] = useState<string>('');

  // ── Estado pantalla 1 ──
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [selectedSubGoalIds, setSelectedSubGoalIds] = useState<string[]>([]);
  const [isLoadingSubGoals, setIsLoadingSubGoals] = useState(false);

  // ── Estado pantalla 2 ──
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [hasFlexibleTime, setHasFlexibleTime] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(60);

  // ── Estado pantalla 3 ──
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSelection[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);

  /**
   * Carga inicial: restaurar draft local.
   */
  useEffect(() => {
    const restoreDraft = async () => {
      const draft = await loadFitnessConfig();
      if (draft) {
        if (draft.experienceLevel) setExperienceLevel(draft.experienceLevel);
        if (draft.trainingHistory) setTrainingHistory(draft.trainingHistory);
        if (draft.selectedSubGoalIds) setSelectedSubGoalIds(draft.selectedSubGoalIds);
        if (draft.preferredWorkoutDays)
          setSelectedDays(draft.preferredWorkoutDays);
        if (draft.hasFlexibleTime !== undefined)
          setHasFlexibleTime(draft.hasFlexibleTime);
        if (draft.sessionDurationPreference)
          setSessionDuration(draft.sessionDurationPreference);
        if (draft.availableEquipment)
          setSelectedEquipment(Array.isArray(draft.availableEquipment) ? draft.availableEquipment : []);
      }
    };
    restoreDraft();
  }, []);

  /**
   * Carga sub-objetivos cuando se llega a la pantalla 1.
   */
  useEffect(() => {
    if (subStep === 1 && subGoals.length === 0) {
      const fetchSubGoals = async () => {
        setIsLoadingSubGoals(true);
        try {
          const token = await getToken();
          const data = await getSubGoals(moduleId, token);
          setSubGoals(Array.isArray(data) ? data : []);
        } catch (e) {
          logger.error('Error cargando sub-objetivos:', e);
          alert('No se pudieron cargar los sub-objetivos.');
        } finally {
          setIsLoadingSubGoals(false);
        }
      };
      fetchSubGoals();
    }
  }, [subStep]);

  /**
   * Carga equipamiento cuando se llega a la pantalla 3.
   */
  useEffect(() => {
    if (subStep === 3 && equipmentList.length === 0) {
      const fetchEquipments = async () => {
        setIsLoadingEquipment(true);
        try {
          const token = await getToken();
          const data = await getEquipments(token);
          setEquipmentList(Array.isArray(data) ? data : []);
        } catch (e) {
          logger.error('Error cargando equipamiento:', e);
          alert('No se pudo cargar el equipamiento.');
        } finally {
          setIsLoadingEquipment(false);
        }
      };
      fetchEquipments();
    }
  }, [subStep]);

  /**
   * Auto-guarda el draft en local al cambiar cualquier valor.
   */
  useEffect(() => {
    saveFitnessConfig({
      experienceLevel,
      trainingHistory,
      selectedSubGoalIds,
      preferredWorkoutDays: selectedDays,
      hasFlexibleTime,
      sessionDurationPreference: hasFlexibleTime ? 0 : sessionDuration,
      availableEquipment: selectedEquipment,
    });
  }, [
    experienceLevel,
    trainingHistory,
    selectedSubGoalIds,
    selectedDays,
    hasFlexibleTime,
    sessionDuration,
    selectedEquipment,
  ]);

  // ── Handlers de navegación ──

  const handleContinueStep0 = () => {
    if (!experienceLevel) {
      alert('Por favor selecciona tu nivel de experiencia.');
      return;
    }
    if (!trainingHistory) {
      alert('Por favor selecciona tu nivel de actividad.');
      return;
    }
    setSubStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();

      await submitFitnessProfile(
        {
          experienceLevel: String(experienceLevel),
          trainingHistory: String(trainingHistory),
          preferredWorkoutDays: selectedDays,
          availableEquipment: selectedEquipment.map((e) => ({
            id: String(e.id),
            qty: Number(e.qty),
          })),
          sessionDurationPreference: hasFlexibleTime ? 0 : sessionDuration,
          subGoals: selectedSubGoalIds,
        },
        token
      );

      onComplete();
    } catch (error) {
      logger.error('Error enviando perfil de fitness:', error);
      alert('Hubo un error al guardar los datos de entrenamiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers de selección ──

  const toggleSubGoal = (id: string) => {
    setSelectedSubGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const setEquipmentQty = (id: string, qty: number) => {
    setSelectedEquipment((prev) =>
      prev.map((e) => (e.id === id ? { ...e, qty } : e))
    );
  };

  const removeEquipment = (id: string) => {
    setSelectedEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  const selectedWithDetails = selectedEquipment.map((sel) => ({
    ...sel,
    name: equipmentList.find((eq) => eq.id === sel.id)?.name ?? '',
  }));

  return {
    subStep,
    setSubStep,
    // pantalla 0
    experienceLevel,
    setExperienceLevel,
    trainingHistory,
    setTrainingHistory,
    handleContinueStep0,
    // pantalla 1
    subGoals,
    selectedSubGoalIds,
    isLoadingSubGoals,
    toggleSubGoal,
    // pantalla 2
    selectedDays,
    setSelectedDays,
    hasFlexibleTime,
    setHasFlexibleTime,
    sessionDuration,
    setSessionDuration,
    // pantalla 3
    equipmentList,
    selectedEquipment,
    setSelectedEquipment,
    isLoadingEquipment,
    selectedWithDetails,
    setEquipmentQty,
    removeEquipment,
    // envío
    handleSubmit,
  };
}
