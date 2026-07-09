import { logger } from '@/src/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { HealthProfilePayload } from '../types/health';
import { FitnessConfigDraft } from '../types/fitness';
import { NutritionConfigDraft } from '../types/nutrition';

const HEALTH_CONFIG_KEY = '@onboarding_health_config';
const FITNESS_CONFIG_KEY = '@onboarding_fitness_config';
const NUTRITION_CONFIG_KEY = '@onboarding_nutrition_config';
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

/**
 * Hook para persistir y recuperar los drafts de configuración de cada módulo
 * durante el onboarding (Health/Fitness/Nutrition), más el flag de completado.
 * Qué módulos están activos y cuáles ya se configuraron NO se persiste acá: eso
 * lo dicta el backend vía `GET /api/onboarding/status` en cada arranque.
 */
export function useModuleConfigStorage() {
  // ── Configuración de Health ──────────────────────────────────────

  const saveHealthConfig = useCallback(
    async (config: HealthProfilePayload) => {
      try {
        await AsyncStorage.setItem(HEALTH_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        logger.error('Error guardando config de Health:', error);
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
        logger.error('Error cargando config de Health:', error);
        return null;
      }
    }, []);

  // ── Configuración de Fitness ─────────────────────────────────────

  const saveFitnessConfig = useCallback(
    async (config: FitnessConfigDraft) => {
      try {
        await AsyncStorage.setItem(FITNESS_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        logger.error('Error guardando config de Fitness:', error);
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
        logger.error('Error cargando config de Fitness:', error);
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
        logger.error('Error guardando config de Nutrition:', error);
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
        logger.error('Error cargando config de Nutrition:', error);
        return null;
      }
    }, []);

  // ── Limpieza total ───────────────────────────────────────────────

  const clearAllModuleConfig = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        HEALTH_CONFIG_KEY,
        FITNESS_CONFIG_KEY,
        NUTRITION_CONFIG_KEY,
      ]);
    } catch (error) {
      logger.error('Error limpiando config de módulos:', error);
    }
  }, []);

  // ── Flag de onboarding completado (fuente de verdad local) ────────

  const setOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      logger.error('Error seteando flag de onboarding completado:', error);
    }
  }, []);

  const isOnboardingCompleted = useCallback(async (): Promise<boolean> => {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return val === 'true';
    } catch (error) {
      logger.error('Error leyendo flag de onboarding completado:', error);
      return false;
    }
  }, []);

  const clearOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch (error) {
      logger.error('Error limpiando flag de onboarding completado:', error);
    }
  }, []);

  return {
    saveHealthConfig,
    loadHealthConfig,
    saveFitnessConfig,
    loadFitnessConfig,
    saveNutritionConfig,
    loadNutritionConfig,
    clearAllModuleConfig,
    setOnboardingCompleted,
    isOnboardingCompleted,
    clearOnboardingCompleted,
  };
}
