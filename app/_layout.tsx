import { logger } from '@/src/utils/logger';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import '@/src/utils/icon-interop';

import { AppFrame } from '@/src/components/common/AppFrame';
import { FullPageLoader } from '@/src/components/common/FullPageLoader';
import { FeedbackHost } from '@/src/components/ui/feedback';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useIsOffline } from '@/src/hooks/useIsOffline';
import { getOnboardingStatus, syncAuthenticatedUser } from '@/src/services/onboarding.service';
import { destroyOfflineData } from '@/src/offline/repository';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined');
}

// App dark-only: forzamos el esquema oscuro en runtime (cubre Expo Go y los
// useColorScheme directos de RN). El app.json lo fija además en builds nativos.
// En web, react-native-web no implementa Appearance.setColorScheme (lanza) y además
// no está conectado al matchMedia que lee useColorScheme ahí: el forzado equivalente
// para web vive en use-color-scheme.web.ts.
if (Platform.OS !== 'web') {
  Appearance.setColorScheme('dark');
}

// Previene que se oculte el splash screen antes de que tengamos la info del usuario
SplashScreen.preventAutoHideAsync();
let isSplashScreenHidden = false;

const hideSplash = async () => {
  if (isSplashScreenHidden) return;
  try {
    await SplashScreen.hideAsync();
  } catch {
    // ignore
  } finally {
    isSplashScreenHidden = true;
  }
};

const normalizeOnboardingStatus = (value: unknown) => {
  return typeof value === 'string' ? value.toUpperCase().trim() : '';
};

const getStatusFromResponse = (responseData: unknown) => {
  if (typeof responseData === 'string') {
    return normalizeOnboardingStatus(responseData);
  }

  if (!responseData || typeof responseData !== 'object') {
    return '';
  }

  const data = responseData as {
    status?: unknown;
    onboardingStatus?: unknown;
    onboarding_status?: unknown;
  };

  return normalizeOnboardingStatus(
    data.status ?? data.onboardingStatus ?? data.onboarding_status
  );
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [completedLocally, setCompletedLocally] = useState<boolean | null>(null);
  const [backendOnboardingStatus, setBackendOnboardingStatus] = useState<string | null>(null);
  const [isResolvingBackendStatus, setIsResolvingBackendStatus] = useState(false);
  const isOffline = useIsOffline();
  // Red-de-seguridad: si Clerk no cargó en 6s (p.ej. su CDN caído) tratamos el arranque
  // como "colgado" para no dejar al usuario en el loader eterno. Se auto-corrige: cuando
  // Clerk termina, `isLoaded` pasa a true y el render vuelve al camino normal.
  const [clerkStalled, setClerkStalled] = useState(false);

  const clerkOnboardingStatus = normalizeOnboardingStatus(user?.publicMetadata?.onboarding_status);
  const resolvedOnboardingStatus = clerkOnboardingStatus || backendOnboardingStatus || '';

  // Leer el flag local de onboarding completado cuando cambia el usuario (para detectar sign in/out)
  useEffect(() => {
    if (!isSignedIn) {
      setCompletedLocally(false);
      setBackendOnboardingStatus(null);
      setIsResolvingBackendStatus(false);
      AsyncStorage.multiRemove([
        '@onboarding_completed',
        '@onboarding_draft',
        '@onboarding_selected_modules',
        '@onboarding_health_config',
        '@onboarding_fitness_config',
        '@onboarding_nutrition_config',
        '@onboarding_module_config_step',
        '@active_modules',
        '@user_routine',
        '@nutrition_routine',
      ]).catch(() => {});
      destroyOfflineData().catch(() => {});
      return;
    }

    AsyncStorage.getItem('@onboarding_completed')
      .then((val) => setCompletedLocally(val === 'true'))
      .catch(() => setCompletedLocally(false));
  }, [isSignedIn, user?.id]);

  // Clerk metadata es solo cache. Si no está, resolvemos el estado real contra el backend.
  useEffect(() => {
    let isMounted = true;

    const resolveOnboardingStatus = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        if (isMounted) {
          setBackendOnboardingStatus(null);
          setIsResolvingBackendStatus(false);
        }
        return;
      }

      if (clerkOnboardingStatus) {
        if (isMounted) {
          setBackendOnboardingStatus(null);
          setIsResolvingBackendStatus(false);
        }
        return;
      }

      if (isMounted) {
        setIsResolvingBackendStatus(true);
      }

      try {
        const token = await getToken();
        await syncAuthenticatedUser(token);
        const responseData = await getOnboardingStatus(token);
        const status = getStatusFromResponse(responseData);

        if (isMounted) {
          setBackendOnboardingStatus(status || null);
        }

        // Metadata de Clerk queda como cache; no bloquea navegación si tarda en refrescar.
        if (status) {
          await user.reload().catch(() => {});
        }
      } catch (error) {
        logger.error('Error resolviendo onboarding contra backend:', error);
        if (isMounted) {
          setBackendOnboardingStatus(null);
        }
      } finally {
        if (isMounted) {
          setIsResolvingBackendStatus(false);
        }
      }
    };

    resolveOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, clerkOnboardingStatus, getToken]);

  useEffect(() => {
    // 1. Si Clerk no ha terminado de cargar o el flag local aún no se leyó, no hacemos nada
    if (!isLoaded || completedLocally === null) return;

    // 2. Revisamos si el usuario ya está en la ruta del login o onboarding
    const inLoginScreen = segments[0] === 'login';
    const inOnboardingScreen = segments[0] === 'onboarding';

    if (!isSignedIn && !inLoginScreen) {
      // 3. Si NO está logueado y NO está en la pantalla de login, lo obligamos a ir a /login
      router.replace('/login');
    } else if (isSignedIn) {
      // Chequeo asíncrono para asegurarnos de que no estamos interfiriendo con un guardado local recién hecho
      AsyncStorage.getItem('@onboarding_completed').then((localVal) => {
        const currentCompletedLocally = localVal === 'true';
        if (currentCompletedLocally !== completedLocally) {
          setCompletedLocally(currentCompletedLocally);
        }

        const isCompleted = resolvedOnboardingStatus === 'COMPLETED' || currentCompletedLocally;

        if (!resolvedOnboardingStatus && !currentCompletedLocally && isResolvingBackendStatus) {
          return;
        }

        if (!isCompleted && !inOnboardingScreen) {
          // El timeout asegura que si Stack recién se monta, ya está listo para enrutar
          setTimeout(() => router.replace('/onboarding'), 0);
        } else if (isCompleted && (inLoginScreen || inOnboardingScreen)) {
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      });
    }

    // Ocultar el splash screen cuando ya sabemos a dónde ir
    setTimeout(() => {
      hideSplash();
    }, 50);
  }, [isSignedIn, isLoaded, segments, resolvedOnboardingStatus, completedLocally, isResolvingBackendStatus, router]);

  // Efecto secundario para refrescar Clerk metadata si está atrasada. No bloquea navegación.
  useEffect(() => {
    let isMounted = true;

    const pollForMetadata = async () => {
      if (!user || !isSignedIn || clerkOnboardingStatus) return;

      for (let i = 0; i < 3; i++) {
        if (!isMounted) break;
        await new Promise(resolve => setTimeout(resolve, 2000));
        await user.reload();

        if (user.publicMetadata?.onboarding_status !== undefined) {
          break;
        }
      }
    };

    pollForMetadata();

    return () => {
      isMounted = false;
    };
  }, [user, isSignedIn, clerkOnboardingStatus]);

  // Timeout de seguridad para el arranque cuando Clerk no termina de cargar.
  useEffect(() => {
    if (isLoaded) {
      setClerkStalled(false);
      return;
    }
    const timeout = setTimeout(() => setClerkStalled(true), 6000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  // Clerk web NO puede inicializar sin red (baja clerk-js remoto). Si estamos offline (o
  // Clerk quedó colgado) y el usuario ya estaba logueado + onboarded en este dispositivo
  // (@onboarding_completed), entramos a la app con los datos locales/SQLite en vez de
  // quedarnos en el loader para siempre. En nativo `isOffline` es siempre false: este
  // bypass no aplica y Clerk levanta la sesión desde SecureStore como siempre.
  const offlineAuthed = !isLoaded && completedLocally === true && (isOffline || clerkStalled);

  // Sin la sesión de Clerk el splash nativo no se oculta solo por el efecto de ruteo
  // (que espera a `isLoaded`); lo bajamos acá al entrar en modo offline.
  useEffect(() => {
    if (offlineAuthed) hideSplash();
  }, [offlineAuthed]);

  const isCompleted = resolvedOnboardingStatus === 'COMPLETED' || completedLocally;
  const isWaitingForBackendStatus = isSignedIn && !resolvedOnboardingStatus && !isCompleted && isResolvingBackendStatus;

  if (!offlineAuthed && (!isLoaded || completedLocally === null || isWaitingForBackendStatus)) {
    // Offline y sin sesión previa cacheada: no hay nada que mostrar sin red. Se lo
    // decimos en vez de girar para siempre.
    const offlineNoSession = isOffline && completedLocally === false;
    const message = offlineNoSession
      ? 'Sin conexión. Reconectate para iniciar sesión.'
      : isWaitingForBackendStatus
        ? 'Sincronizando tu perfil...'
        : 'Preparando tu espacio...';

    return <FullPageLoader message={message} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen
        name="session"
        options={{
          headerShown: false,
          // En web el `fullScreenModal` no estira al viewport y queda con fondo
          // transparente (se ve la pantalla de atrás). Usamos `card` en web.
          presentation: Platform.OS === 'web' ? 'card' : 'fullScreenModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#09090b' },
        }}
      />
      <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Configura la barra de navegación nativa de Android (solo Android).
  // Con edge-to-edge habilitado, Android no permite forzar posición ni fondo:
  // el área detrás de la navigation bar la pinta el propio layout.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme]);

  // Initialize query client for react-query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  return (
    <GestureHandlerRootView className="flex-1">
      <ActionSheetProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider
            publishableKey={publishableKey}
            tokenCache={tokenCache}
          >
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AppFrame>
                <RootNavigator />
              </AppFrame>
              {/* Hosts de feedback no bloqueante (toasts + confirmaciones in-app) */}
              <FeedbackHost />
              {/* App dark-only: íconos/texto de la status bar siempre en claro para que se vean */}
              <StatusBar style="light" />
            </ThemeProvider>
          </ClerkProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}




