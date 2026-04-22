import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import './global.css';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useEffect } from 'react';
import { FullPageLoader } from '@/src/components/common/FullPageLoader';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined');
}

// Previene que se oculte el splash screen antes de que tengamos la info del usuario
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} se utilizó para autenticar\n`);
      } else {
        console.log('Ningún token fue encontrado bajo esta clave: ' + key);
      }
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
    useEffect(() => {
    // 1. Si Clerk no ha terminado de cargar, no hacemos nada
    if (!isLoaded) return;

    // 2. Revisamos si el usuario ya está en la ruta del login o onboarding
    const inLoginScreen = segments[0] === 'login';
    const inOnboardingScreen = segments[0] === 'onboarding';

    // Manejo de race-condition: Si la metadata aún no llega del webhook del backend, esperamos.
    const isMetadataReady = user ? user.publicMetadata?.onboarding_complete !== undefined : false;
    
    if (isSignedIn && !isMetadataReady) {
      return; 
    }

    if (!isSignedIn && !inLoginScreen) {
      // 3. Si NO está logueado y NO está en la pantalla de login, lo obligamos a ir a /login
      router.replace('/login');
    } else if (isSignedIn) {
      // Verificamos si necesita onboarding
      const needsOnboarding = user?.publicMetadata?.onboarding_complete === false;
      const aux = user?.unsafeMetadata?.onboarding_complete;
      if (needsOnboarding && !inOnboardingScreen) {
        // Si necesita onboarding y no está en la pantalla, lo mandamos
        router.replace('/onboarding');
      } else if (!needsOnboarding && (inLoginScreen || inOnboardingScreen)) {
        // Si NO necesita onboarding pero está en login o onboarding, lo mandamos a la app (tabs)
        router.replace('/(tabs)');
      }
    }

    // Ocultar el splash screen con un timeout muy breve para 
    // permitir a la navegación procesar la nueva ruta y evitar parpadeos (flash) de layout previo
    setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
  }, [isSignedIn, isLoaded, segments, user]); // Aseguramos que reaccione cuando 'user' se actualiza

  // Efecto secundario para recargar al usuario si es nuevo y esperamos el webhook
  useEffect(() => {
    let isMounted = true;
    
    const pollForMetadata = async () => {
      if (!user) return;
      
      // Haremos polling solo si no tenemos la metadata definida
      if (user.publicMetadata?.onboarding_complete === undefined) {
        for (let i = 0; i < 5; i++) {
          if (!isMounted) break;
          await new Promise(resolve => setTimeout(resolve, 1500));
          await user.reload();
          
          if (user.publicMetadata?.onboarding_complete !== undefined) {
            break;
          }
        }
      }
    };

    pollForMetadata();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Solo se ejecuta cuando el usuario se inicializa

  const isMetadataReady = user ? user.publicMetadata?.onboarding_complete !== undefined : false;
  const isWaitingForMetadata = isSignedIn && !isMetadataReady;
  
  // Si la metadata dice que necesita onboarding pero los segmentos de la URL aún no se actualizan,
  // mantenemos el loader para evitar el parpadeo de la pantalla Home.
  const needsOnboarding = user?.publicMetadata?.onboarding_complete === false;
  const isRoutingToOnboarding = isSignedIn && isMetadataReady && needsOnboarding && segments[0] !== 'onboarding';

  if (!isLoaded || isWaitingForMetadata || isRoutingToOnboarding) {
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
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >

      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </ClerkProvider>
  );
}
