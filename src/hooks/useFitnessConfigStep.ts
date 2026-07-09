import { logger } from '@/src/utils/logger';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import { getSubGoals, submitFitnessProfile } from '@/src/services/fitness.service';
import { SubGoal } from '@/src/types/fitness';
import { isRequestCanceled } from '@/src/utils/request-cancellation';
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
 * (`FitnessConfigStep`): 2 sub-pasos con su estado, restauración/auto-guardado
 * del draft local, carga de sub-objetivos y envío al backend.
 * Los días, la duración y el equipamiento ya no se piden acá: se configuran en
 * el modal de generación de rutina. El componente solo consume estos valores
 * para renderizar cada pantalla.
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
      }
    };
    restoreDraft();
  }, []);

  /**
   * Carga sub-objetivos cuando se llega a la pantalla 1.
   */
  useEffect(() => {
    if (subStep === 1 && subGoals.length === 0) {
      const controller = new AbortController();
      const { signal } = controller;

      const fetchSubGoals = async () => {
        setIsLoadingSubGoals(true);
        try {
          const token = await getToken();
          if (signal.aborted) return;
          const data = await getSubGoals(moduleId, token, signal);
          if (!signal.aborted) setSubGoals(Array.isArray(data) ? data : []);
        } catch (e) {
          if (signal.aborted || isRequestCanceled(e)) return;
          logger.error('Error cargando sub-objetivos:', e);
          alert('No se pudieron cargar los sub-objetivos.');
        } finally {
          if (!signal.aborted) setIsLoadingSubGoals(false);
        }
      };
      fetchSubGoals();
      return () => {
        controller.abort();
      };
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
    });
  }, [experienceLevel, trainingHistory, selectedSubGoalIds]);

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
    // envío
    handleSubmit,
  };
}
