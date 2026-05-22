import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { CreateRoutineDay, RoutineDraft } from '../types/create-routine';

const DRAFT_KEY = '@routine_draft';

interface UseRoutineDraftReturn {
  draft: RoutineDraft | null;
  isLoadingDraft: boolean;
  saveDraft: (name: string, days: CreateRoutineDay[]) => Promise<void>;
  clearDraft: () => Promise<void>;
}

export function useRoutineDraft(): UseRoutineDraftReturn {
  const [draft, setDraft] = useState<RoutineDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_KEY);
        if (stored) setDraft(JSON.parse(stored));
      } catch {
        // No-op: si no se puede leer, arrancamos sin borrador
      } finally {
        setIsLoadingDraft(false);
      }
    };
    load();
  }, []);

  const saveDraft = useCallback(async (name: string, days: CreateRoutineDay[]) => {
    const data: RoutineDraft = { name, days };
    setDraft(data);
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // No-op
    }
  }, []);

  const clearDraft = useCallback(async () => {
    setDraft(null);
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {
      // No-op
    }
  }, []);

  return { draft, isLoadingDraft, saveDraft, clearDraft };
}
