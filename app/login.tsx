import { useOAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import {
  View,
  Text,
  Alert,
  Platform,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import GoogleIcon from '@/assets/svg/google.svg';
import AppleDarkIcon from '@/assets/svg/Apple_dark.svg';
import AppleLightIcon from '@/assets/svg/Apple_light.svg';

// Esto es para que en Android se cierre el navegador web cuando termina el flujo seguro
WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Pantalla de bienvenida y autenticación social */
export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hooks de autenticación social de Clerk
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  // Estado para controlar la vista actual
  const [showSocialLogin, setShowSocialLogin] = useState(false);

  /** Autenticación con redes sociales */
  const onSocialLoginPress = async (strategy: 'oauth_google' | 'oauth_apple') => {
    try {
      const startOAuthFlow = strategy === 'oauth_google' ? startGoogleOAuthFlow : startAppleOAuthFlow;

      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)'),
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('Error de OAuth', err);
      if(err?.e?.toUpperCase() == "You're already signed in".toUpperCase()){
        Linking.createURL('/(tabs)')
      }
      Alert.alert('Interrumpido', 'No se pudo iniciar sesión con esta red.');
    }
  };

  return (
    <View className="flex-1 bg-teal-600">
      {/* Imagen de fondo */}
      <ImageBackground
        source={require('@/assets/images/login-background.png')}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute', top: 0, left: 0 }}
        resizeMode="cover"
      >
        {/* Degradado overlay simulado */}
        <View className="absolute bottom-0 left-0 right-0 h-24" />
      </ImageBackground>

      {/* Contenedor principal para alienar la tarjeta inferior */}
      <View className="flex-1 justify-end">
        {/* Panel inferior Reanimado */}
        <Animated.View 
          layout={LinearTransition.springify().mass(0.5)}
          className="bg-white dark:bg-zinc-900 rounded-t-[36px] px-8 pt-10 pb-8 shadow-black/10 elevation-2xl overflow-hidden w-full"
          style={{ paddingBottom: Platform.OS === 'ios' ? 50 : 32, minHeight: 320 }}
        >
          {/* Contenido de bienvenida (paso 1) */}
          {!showSocialLogin ? (
            <Animated.View
              key="welcome"
              entering={FadeInDown.springify().mass(0.5).delay(100)}
              exiting={FadeOutUp.duration(200)}
              className="w-full"
            >
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={{ height: 60, width: 180, resizeMode: 'contain' }}
                className="mb-2 mx-auto"
              />

              <Text className="text-3xl font-bold leading-10 mt-2 text-slate-900 dark:text-white">
                Tu camino hacia{'\n'}una vida saludable
              </Text>

              <Text className="text-base leading-6 mt-3 text-slate-500 dark:text-zinc-400">
                Nutrición personalizada, rutinas de ejercicio{'\n'}y bienestar integral en una sola app.
              </Text>

              <TouchableOpacity
                className="bg-cyan-500 py-[18px] rounded-2xl items-center mt-10 shadow-teal-500/30 elevation-lg"
                onPress={() => setShowSocialLogin(true)}
                activeOpacity={0.85}
              >
                <Text className="text-white text-lg font-bold tracking-wide">Comenzar</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* Contenido de login social (paso 2) */
            <Animated.View
              key="social"
              entering={FadeInDown.springify().mass(0.5).delay(100)}
              exiting={FadeOutUp.duration(200)}
              className="w-full flex-col justify-center"
            >
              <Text className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
                Iniciá sesión
              </Text>

              <Text className="text-base text-center mb-9 text-slate-500 dark:text-zinc-400">
                Conectá tu cuenta para continuar
              </Text>

              {/* Botón de Google */}
              <TouchableOpacity
                className="flex-row items-center justify-center py-4 rounded-xl gap-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                onPress={() => onSocialLoginPress('oauth_google')}
                activeOpacity={0.8}
              >
                <GoogleIcon width={24} height={24} />
                <Text className="text-base font-semibold text-slate-800 dark:text-white">
                  Continuar con Google
                </Text>
              </TouchableOpacity>

              {/* Botón de Apple */}
              {Platform.OS === 'ios' && (
                <>
                  <View className="flex-row items-center my-5 gap-3">
                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-700" />
                    <Text className="text-sm font-medium text-gray-400 dark:text-zinc-500">o</Text>
                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-700" />
                  </View>

                  <TouchableOpacity
                    className="flex-row items-center justify-center py-4 rounded-xl gap-3 bg-black dark:bg-white"
                    onPress={() => onSocialLoginPress('oauth_apple')}
                    activeOpacity={0.8}
                  >
                    {isDark ? <AppleLightIcon width={24} height={24} /> : <AppleDarkIcon width={24} height={24} />}
                    <Text className="text-base font-semibold text-white dark:text-black">
                      Continuar con Apple
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Enlace para volver */}
              <TouchableOpacity
                className="items-center mt-7 py-2"
                onPress={() => setShowSocialLogin(false)}
                activeOpacity={0.7}
              >
                <Text className="text-base font-medium text-slate-500 dark:text-zinc-400">
                  ← Volver
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}
