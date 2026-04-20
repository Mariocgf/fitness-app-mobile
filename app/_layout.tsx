import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import './global.css';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useEffect } from 'react';

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
  const segments = useSegments();
  const router = useRouter();
    useEffect(() => {
    // 1. Si Clerk no ha terminado de cargar, no hacemos nada
    if (!isLoaded) return;

    // 2. Revisamos si el usuario ya está en la ruta del login
    // segments[0] devuelve el nombre del primer segmento de la URL. Si estamos en /login, será 'login'
    const inLoginScreen = segments[0] === 'login';

    if (!isSignedIn && !inLoginScreen) {
      // 3. Si NO está logueado y NO está en la pantalla de login, lo obligamos a ir a /login
      router.replace('/login');
    } else if (isSignedIn && inLoginScreen) {
      // 4. Si SÍ está logueado pero intenta estar en la pantalla de login, lo mandamos a la app (tabs)
      router.replace('/(tabs)');
    }

    // Ocultar el splash screen con un timeout muy breve para 
    // permitir a la navegación procesar la nueva ruta y evitar parpadeos (flash) de layout previo
    setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 50);
  }, [isSignedIn, isLoaded, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
