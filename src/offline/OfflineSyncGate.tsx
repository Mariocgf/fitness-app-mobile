import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { syncOfflineOperations } from '@/src/offline/service';
import { logger } from '@/src/utils/logger';

export function OfflineSyncGate() {
  const { getToken, isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !isOnline || isSyncingRef.current) return;

    let cancelled = false;
    isSyncingRef.current = true;

    const run = async () => {
      try {
        const token = await getToken();
        if (!cancelled) await syncOfflineOperations(token);
      } catch (error) {
        logger.error('[OfflineSyncGate] Error sincronizando offline:', error);
      } finally {
        isSyncingRef.current = false;
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [getToken, isOnline, isSignedIn]);

  return null;
}
