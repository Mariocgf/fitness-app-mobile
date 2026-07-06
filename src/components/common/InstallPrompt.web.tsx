import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';

import { IconTile } from './IconTile';

/**
 * Evento no estándar de Chromium (no está en las libs DOM de TS). Se dispara cuando
 * el navegador considera la PWA instalable; hay que capturarlo y llamarlo bajo un
 * gesto del usuario para mostrar el diálogo nativo de instalación.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

/** Clave de localStorage para recordar que el usuario descartó el prompt. */
const DISMISS_KEY = 'wellium:install-dismissed-at';
/** Ventana de silencio tras descartar: no volvemos a molestar por 7 días. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** La app ya corre instalada (standalone) → nunca mostramos el prompt. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches;
  // iOS Safari expone `navigator.standalone` en vez de `display-mode`.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(displayMode) || iosStandalone;
}

/** Detecta iOS (iPhone/iPad), donde `beforeinstallprompt` NO existe. */
function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOsDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se reporta como "Mac"; lo detectamos por soporte táctil.
  const iPadOs = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return iOsDevice || iPadOs;
}

/** ¿El usuario descartó el prompt dentro de la ventana de cooldown? */
function wasRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    // localStorage puede fallar (modo privado / permisos). Ante la duda, no molestamos.
    return true;
  }
}

/**
 * Banner flotante que ofrece instalar la PWA sin obligar al usuario a hacer todo el
 * recorrido manual de "Compartir → Añadir a inicio".
 *
 * - Chrome/Edge (Android y desktop): captura `beforeinstallprompt` y dispara el diálogo
 *   nativo de instalación con un solo tap.
 * - iOS/Safari: Apple no soporta `beforeinstallprompt`, así que solo podemos mostrar las
 *   instrucciones para hacerlo a mano (es la única vía que Apple permite).
 */
export function InstallPrompt() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'native' | 'ios'>('native');
  const [isBusy, setIsBusy] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Ya instalada o descartada hace poco: no mostramos nada.
    if (isStandalone() || wasRecentlyDismissed()) return;

    // iOS no dispara evento: mostramos instrucciones manuales directamente.
    if (isIos()) {
      setMode('ios');
      setVisible(true);
      return;
    }

    // Chromium: guardamos el evento y recién ahí mostramos el banner (si no hay
    // evento, el botón "Instalar" no haría nada, así que no lo ofrecemos).
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setMode('native');
      setVisible(true);
    };

    // Si la instalación se concreta (por el prompt o desde el menú del navegador),
    // ocultamos el banner y no volvemos a insistir.
    const handleInstalled = () => {
      deferredPrompt.current = null;
      setVisible(false);
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        // Silencioso: no poder persistir no debe romper la app.
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  /** Dispara el diálogo nativo de instalación (solo Chromium). */
  const handleInstall = async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return;
    setIsBusy(true);
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      // El evento es de un solo uso: se descarta llamado o no.
      deferredPrompt.current = null;
      setVisible(false);
      if (outcome === 'dismissed') rememberDismiss();
    } catch {
      // Si el navegador rechaza el prompt, cerramos el banner sin ensuciar la UI.
      setVisible(false);
    } finally {
      setIsBusy(false);
    }
  };

  /** Cierra el banner y respeta el cooldown de 7 días. */
  const handleDismiss = () => {
    rememberDismiss();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View
      // `fixed` ancla el banner al viewport; `box-none` deja pasar los toques fuera de la card.
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        // Flota por encima del tab bar nativo (mismo offset que los CTA de la app).
        paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        zIndex: 50,
      }}
      pointerEvents="box-none"
    >
      <View
        className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-4"
        style={{ maxWidth: 456 }}
      >
        <View className="flex-row items-start">
          <IconTile
            name={mode === 'ios' ? 'share-outline' : 'download-outline'}
            color="#fafafa"
            className="bg-zinc-800"
          />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-white">Instalá Wellium</Text>
            <Text className="mt-1 text-sm leading-5 text-zinc-400">
              {mode === 'ios'
                ? 'Tocá el botón Compartir y elegí «Añadir a pantalla de inicio».'
                : 'Accedé más rápido con la app en tu pantalla de inicio.'}
            </Text>
          </View>
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Descartar"
            className="ml-2 p-1"
          >
            <Ionicons name="close" size={20} color="#71717a" />
          </Pressable>
        </View>

        {mode === 'native' ? (
          <Pressable
            onPress={handleInstall}
            disabled={isBusy}
            accessibilityRole="button"
            className="mt-3 items-center rounded-2xl bg-zinc-50 py-3 active:opacity-80"
            style={isBusy ? { opacity: 0.6 } : undefined}
          >
            <Text className="text-base font-semibold text-zinc-900">
              {isBusy ? 'Instalando…' : 'Instalar app'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Persiste el momento del descarte para respetar el cooldown. */
function rememberDismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Silencioso a propósito.
  }
}
