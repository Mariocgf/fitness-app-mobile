import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    NetInfo.fetch()
      .then((state) => {
        if (!mounted) return;
        setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
      })
      .catch(() => {
        if (mounted) setIsOnline(true);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline };
}
