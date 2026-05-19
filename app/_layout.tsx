import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import './global.css';

import { FullPageLoader } from '@/src/components/common/FullPageLoader';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined');
}

// Previene que se oculte el splash screen antes de que tengamos la info del usuario
SplashScreen.preventAutoHideAsync();
let isSplashScreenHidden = false;

const hideSplash = async () => {
  if (isSplashScreenHidden) return;
  try {
    await SplashScreen.hideAsync();
  } catch (error) {
    // ignore
  } finally {
    isSplashScreenHidden = true;
  }
};

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [completedLocally, setCompletedLocally] = useState<boolean | null>(null);

  // Leer el flag local de onboarding completado cuando cambia el usuario (para detectar sign in/out)
  useEffect(() => {
    if (!isSignedIn) {
      setCompletedLocally(false);
      AsyncStorage.multiRemove([
        '@onboarding_completed',
        '@onboarding_draft',
        '@onboarding_selected_modules',
        '@onboarding_health_config',
        '@onboarding_fitness_config',
        '@onboarding_nutrition_config',
        '@onboarding_module_config_step'
      ]).catch(() => {});
      return;
    }

    const clerkStatus = user?.publicMetadata?.onboarding_status as string | undefined;
    // Si Clerk ya tiene un estado explícito que no es COMPLETED, el flag local no es confiable
    if (clerkStatus && clerkStatus !== 'COMPLETED') {
      AsyncStorage.removeItem('@onboarding_completed').catch(() => {});
      AsyncStorage.removeItem('@onboarding_module_config_step').catch(() => {});
      setCompletedLocally(false);
      return;
    }

    AsyncStorage.getItem('@onboarding_completed')
      .then((val) => setCompletedLocally(val === 'true'))
      .catch(() => setCompletedLocally(false));
  }, [isSignedIn, user?.publicMetadata?.onboarding_status]);

  useEffect(() => {
    // 1. Si Clerk no ha terminado de cargar o el flag local aún no se leyó, no hacemos nada
    if (!isLoaded || completedLocally === null) return;

    // 2. Revisamos si el usuario ya está en la ruta del login o onboarding
    const inLoginScreen = segments[0] === 'login';
    const inOnboardingScreen = segments[0] === 'onboarding';

    // Manejo de race-condition: Si la metadata aún no llega del webhook del backend, esperamos.
    const isMetadataReady = user ? user.publicMetadata?.onboarding_status !== undefined : false;

    if (isSignedIn && !isMetadataReady) {
      // Mientras Clerk no tenga metadata, no tomar decisiones de navegación
      setTimeout(() => {
        hideSplash();
      }, 100);
      return;
    }

    if (!isSignedIn && !inLoginScreen) {
      // 3. Si NO está logueado y NO está en la pantalla de login, lo obligamos a ir a /login
      router.replace('/login');
    } else if (isSignedIn) {
      const onboardingStatus = user?.publicMetadata?.onboarding_status as string;
      // Si el backend tiene un estado explícito que NO es COMPLETED, no confiar en el flag local
      const backendSaysNotDone = onboardingStatus && onboardingStatus !== 'COMPLETED';
      const isCompleted = onboardingStatus === 'COMPLETED' || (!backendSaysNotDone && completedLocally);

      if (!isCompleted && !inOnboardingScreen) {
        router.replace('/onboarding');
      } else if (isCompleted && (inLoginScreen || inOnboardingScreen)) {
        router.replace('/(tabs)');
      }
    }

    // Ocultar el splash screen cuando ya sabemos a dónde ir
    setTimeout(() => {
      hideSplash();
    }, 50);
  }, [isSignedIn, isLoaded, segments, user?.publicMetadata?.onboarding_status, completedLocally]);

  // Efecto secundario para recargar al usuario si es nuevo y esperamos el webhook
  useEffect(() => {
    let isMounted = true;

    const pollForMetadata = async () => {
      if (!user || !isSignedIn) return;

      // Haremos polling solo si no tenemos el estado definido
      if (user.publicMetadata?.onboarding_status === undefined) {
        for (let i = 0; i < 5; i++) {
          if (!isMounted) break;
          await new Promise(resolve => setTimeout(resolve, 2000));
          await user.reload();

          if (user.publicMetadata?.onboarding_status !== undefined) {
            break;
          }
        }
      }
    };

    pollForMetadata();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isSignedIn]); 

  const isMetadataReady = user ? user.publicMetadata?.onboarding_status !== undefined : false;
  const isWaitingForMetadata = isSignedIn && !isMetadataReady;

  // Si la metadata dice que necesita onboarding pero los segmentos de la URL aún no se actualizan,
  // mantenemos el loader para evitar el parpadeo de la pantalla Home.
  // Si el webhook de Clerk o el backend reporta un estado distinto de COMPLETED,
  // ese estado tiene prioridad sobre la caché local (por si el usuario borró la cuenta
  // y creó otra en el mismo dispositivo).
  const onboardingStatus = user?.publicMetadata?.onboarding_status as string;
  const backendSaysNotDone = onboardingStatus && onboardingStatus !== 'COMPLETED';
  const isCompleted = onboardingStatus === 'COMPLETED' || (!backendSaysNotDone && completedLocally);
    
  const isRoutingToOnboarding = isSignedIn && isMetadataReady && !isCompleted && segments[0] !== 'onboarding';

  if (!isLoaded || completedLocally === null || isWaitingForMetadata || isRoutingToOnboarding) {
    return (
      <FullPageLoader
        message={isWaitingForMetadata ? "Sincronizando tu perfil..." : "Preparando tu espacio..."}
      />
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="session" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Initialize query client for react-query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider
          publishableKey={publishableKey}
          tokenCache={tokenCache}
        >
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
