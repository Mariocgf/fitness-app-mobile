import { useCallback, useState } from 'react';

import { useAuth } from '@clerk/clerk-expo';

import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { useOfflineModuleStatus } from '@/src/hooks/useOfflineModuleStatus';
import {
  downloadNutritionRoutineOffline,
  syncOfflineOperations,
} from '@/src/offline/service';
import { OfflineModuleStatus } from '@/src/offline/types';

export interface NutritionOfflineRoutine {
  isOnline: boolean;
  status: OfflineModuleStatus;
  isDownloading: boolean;
  isSyncing: boolean;
  error: string | null;
  download: () => Promise<void>;
  sync: () => Promise<void>;
}

/**
 * Encapsula el estado offline de la rutina nutricional activa (status + descarga + sync).
 * Se monta UNA sola vez en la pantalla (`index`) para tener una única fuente de verdad,
 * y se baja por props al header y a la vista del plan. Así el botón de descarga del
 * header y el banner de estado nunca se desincronizan.
 */
export function useNutritionOfflineRoutine(): NutritionOfflineRoutine {
  const { getToken } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { status, refresh } = useOfflineModuleStatus('nutrition-active-routine');

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setError(null);
    try {
      const token = await getToken();
      await downloadNutritionRoutineOffline(token);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'No pudimos descargar el plan offline.');
    } finally {
      setIsDownloading(false);
    }
  }, [getToken, isDownloading, refresh]);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setError(null);
    try {
      const token = await getToken();
      await syncOfflineOperations(token);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'No pudimos sincronizar ahora.');
    } finally {
      setIsSyncing(false);
    }
  }, [getToken, isSyncing, refresh]);

  return { isOnline, status, isDownloading, isSyncing, error, download, sync };
}
