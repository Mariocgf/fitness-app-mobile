import { Platform } from 'react-native';

import { PurchasePlatform } from '../../types/subscription';

/**
 * Resuelve la plataforma de compra que espera el backend (`"Ios"` | `"Android"`).
 * En nativo sale de `Platform.OS`; en web/PWA se infiere del user agent (un PWA
 * corre igual sobre un dispositivo iOS o Android), con fallback a `Android`.
 */
export const getPurchasePlatform = (): PurchasePlatform => {
  if (Platform.OS === 'ios') return 'Ios';
  if (Platform.OS === 'android') return 'Android';

  // Web / PWA: inferir del user agent.
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return 'Ios';
  }
  return 'Android';
};
