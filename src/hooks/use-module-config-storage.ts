import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { Module } from '../types/user';
import { HealthProfilePayload } from '../types/health';
import { FitnessConfigDraft } from '../types/fitness';
import { NutritionConfigDraft } from '../types/nutrition';

const SELECTED_MODULES_KEY = '@onboarding_selected_modules';
const HEALTH_CONFIG_KEY = '@onboarding_health_config';
const FITNESS_CONFIG_KEY = '@onboarding_fitness_config';
const NUTRITION_CONFIG_KEY = '@onboarding_nutrition_config';
const MODULE_CONFIG_STEP_KEY = '@onboarding_module_config_step';
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

/**
 * Hook para persistir y recuperar los datos de configuración de módulos
 * durante el onboarding. Permite restaurar el progreso si el usuario
 * cierra la app a mitad de la configuración.
 */
export function useModuleConfigStorage() {
  // ── Módulos activos ──────────────────────────────────────────────

  const saveSelectedModules = useCallback(async (modules: Module[]) => {
    try {
      await AsyncStorage.setItem(SELECTED_MODULES_KEY, JSON.stringify(modules));
    } catch (error) {
      console.error('Error guardando módulos seleccionados:', error);
    }
  }, []);

  const loadSelectedModules = useCallback(async (): Promise<Module[] | null> => {
    try {
      const raw = await AsyncStorage.getItem(SELECTED_MODULES_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error cargando módulos seleccionados:', error);
      return null;
    }
  }, []);

  // ── Configuración de Health ──────────────────────────────────────

  const saveHealthConfig = useCallback(
    async (config: HealthProfilePayload) => {
      try {
        await AsyncStorage.setItem(HEALTH_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        console.error('Error guardando config de Health:', error);
      }
    },
    []
  );

  const loadHealthConfig =
    useCallback(async (): Promise<HealthProfilePayload | null> => {
      try {
        const raw = await AsyncStorage.getItem(HEALTH_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.error('Error cargando config de Health:', error);
        return null;
      }
    }, []);

  // ── Configuración de Fitness ─────────────────────────────────────

  const saveFitnessConfig = useCallback(
    async (config: FitnessConfigDraft) => {
      try {
        await AsyncStorage.setItem(FITNESS_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        console.error('Error guardando config de Fitness:', error);
      }
    },
    []
  );

  const loadFitnessConfig =
    useCallback(async (): Promise<FitnessConfigDraft | null> => {
      try {
        const raw = await AsyncStorage.getItem(FITNESS_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.error('Error cargando config de Fitness:', error);
        return null;
      }
    }, []);

  // ── Configuración de Nutrition ────────────────────────────────────

  const saveNutritionConfig = useCallback(
    async (config: NutritionConfigDraft) => {
      try {
        await AsyncStorage.setItem(
          NUTRITION_CONFIG_KEY,
          JSON.stringify(config)
        );
      } catch (error) {
        console.error('Error guardando config de Nutrition:', error);
      }
    },
    []
  );

  const loadNutritionConfig =
    useCallback(async (): Promise<NutritionConfigDraft | null> => {
      try {
        const raw = await AsyncStorage.getItem(NUTRITION_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.error('Error cargando config de Nutrition:', error);
        return null;
      }
    }, []);

  // ── Sub-paso de configuración ────────────────────────────────────

  const saveConfigStep = useCallback(async (step: number) => {
    try {
      await AsyncStorage.setItem(MODULE_CONFIG_STEP_KEY, String(step));
    } catch (error) {
      console.error('Error guardando config step:', error);
    }
  }, []);

  const loadConfigStep = useCallback(async (): Promise<number | null> => {
    try {
      const raw = await AsyncStorage.getItem(MODULE_CONFIG_STEP_KEY);
      return raw !== null ? parseInt(raw, 10) : null;
    } catch (error) {
      console.error('Error cargando config step:', error);
      return null;
    }
  }, []);

  // ── Limpieza total ───────────────────────────────────────────────

  const clearAllModuleConfig = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        SELECTED_MODULES_KEY,
        HEALTH_CONFIG_KEY,
        FITNESS_CONFIG_KEY,
        NUTRITION_CONFIG_KEY,
        MODULE_CONFIG_STEP_KEY,
      ]);
    } catch (error) {
      console.error('Error limpiando config de módulos:', error);
    }
  }, []);

  // ── Flag de onboarding completado (fuente de verdad local) ────────

  const setOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Error seteando flag de onboarding completado:', error);
    }
  }, []);

  const isOnboardingCompleted = useCallback(async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return val === 'true';
    } catch (error) {
      console.error('Error leyendo flag de onboarding completado:', error);
      return false;
    }
  }, []);

  const clearOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch (error) {
      console.error('Error limpiando flag de onboarding completado:', error);
    }
  }, []);

  return {
    saveSelectedModules,
    loadSelectedModules,
    saveHealthConfig,
    loadHealthConfig,
    saveFitnessConfig,
    loadFitnessConfig,
    saveNutritionConfig,
    loadNutritionConfig,
    saveConfigStep,
    loadConfigStep,
    clearAllModuleConfig,
    setOnboardingCompleted,
    isOnboardingCompleted,
    clearOnboardingCompleted,
  };
}
