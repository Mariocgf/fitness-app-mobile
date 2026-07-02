import { useEffect, useState } from 'react';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 *
 * App dark-only: react-native-web no implementa `Appearance.setColorScheme`, así que el forzado
 * de tema oscuro que en nativo hace `app/_layout.tsx` vía Appearance no aplica en web. Acá se
 * fuerza 'dark' directamente en vez de leer `prefers-color-scheme` del sistema, para no divergir
 * del resto de la app (NativeWind ya es 100% dark-only, sin prefijos `dark:`).
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return 'dark';
  }

  return 'light';
}
