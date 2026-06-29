import { useCallback, useEffect, useState } from 'react';

import { getOfflineModuleStatus } from '@/src/offline/repository';
import { OfflineModuleStatus, OfflineSnapshotType } from '@/src/offline/types';

const EMPTY_STATUS: OfflineModuleStatus = {
  isAvailable: false,
  downloadedAt: null,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
};

export function useOfflineModuleStatus(type: OfflineSnapshotType) {
  const [status, setStatus] = useState<OfflineModuleStatus>(EMPTY_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setStatus(await getOfflineModuleStatus(type));
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, isLoading, refresh };
}
