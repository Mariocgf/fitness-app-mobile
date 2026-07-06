import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Solo web tiene un "sin red" real que rompe a Clerk (clerk-js se baja remoto).
// En nativo Clerk levanta la sesion desde SecureStore, asi que NUNCA hace falta el
// bypass offline → devolvemos siempre false y el comportamiento nativo queda intacto.
const readOffline = () =>
  Platform.OS === 'web' && typeof navigator !== 'undefined'
    ? navigator.onLine === false
    : false;

/**
 * `true` cuando el navegador reporta que no hay conexion (solo web). Reactivo a los
 * eventos `online`/`offline`. En nativo siempre `false`.
 */
export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(readOffline);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOffline;
}
