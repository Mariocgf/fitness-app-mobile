import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { OnboardingDraft } from '../types/user';

const STORAGE_KEY = '@onboarding_draft';

/**
 * Hook para persistir y recuperar los datos parciales del onboarding.
 * Permite restaurar el progreso si el usuario cierra la app.
 */
export function useOnboardingStorage() {
  const saveDraft = useCallback(async (draft: OnboardingDraft) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Error guardando draft de onboarding:', error);
    }
  }, []);

  const loadDraft = useCallback(async (): Promise<OnboardingDraft | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error cargando draft de onboarding:', error);
      return null;
    }
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error limpiando draft de onboarding:', error);
    }
  }, []);

  return { saveDraft, loadDraft, clearDraft };
}
