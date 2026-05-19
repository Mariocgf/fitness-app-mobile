import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
    Alert,
    Dimensions,
    Platform,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import AppleDarkIcon from '@/assets/svg/Apple_dark.svg';
import AppleLightIcon from '@/assets/svg/Apple_light.svg';
import GoogleIcon from '@/assets/svg/google.svg';

// Esto es para que en Android se cierre el navegador web cuando termina el flujo seguro
WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Pantalla de bienvenida y autenticación social */
export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hooks de autenticación social de Clerk
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

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
    <View className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      {/* Círculo superior izquierdo - parcialmente fuera de pantalla */}
      <View 
        className="absolute -top-16 -left-24 w-[360px] h-[360px] rounded-full bg-slate-900 dark:bg-slate-800 justify-center"
        style={{ paddingLeft: 110, paddingTop: 100 }}
      >
        <Text className="text-white text-5xl font-bold leading-tight text-left">
          Tu{'\n'}cuerpo.{'\n'}Tu{'\n'}energía.{'\n'}Tu{'\n'}salud.
        </Text>
      </View>

      {/* Círculo inferior derecho - parcialmente fuera de pantalla */}
      <View 
        className="absolute top-[45%] -right-16 w-[280px] h-[280px] rounded-full bg-slate-900 dark:bg-slate-800 justify-center"
        style={{ paddingRight: 80 }}
      >
        <Text className="text-white text-4xl font-bold leading-tight text-right">
          Todo en{'\n'}un solo{'\n'}lugar
        </Text>
      </View>

      {/* Contenedor de botones en la parte inferior */}
      <View 
        className="absolute bottom-0 left-0 right-0 px-6 pb-12 pt-8"
        style={{ paddingBottom: Platform.OS === 'ios' ? 50 : 32 }}
      >
        {/* Botón de Google */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          onPress={() => onSocialLoginPress('oauth_google')}
          activeOpacity={0.8}
        >
          <GoogleIcon width={20} height={20} />
          <Text className="text-base font-semibold text-slate-900 dark:text-slate-50 ml-3">
            Continuar con Google
          </Text>
        </TouchableOpacity>

        {/* Botón de Apple */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 rounded-full bg-zinc-950 dark:bg-slate-50 mt-4 shadow-sm"
            onPress={() => onSocialLoginPress('oauth_apple')}
            activeOpacity={0.8}
          >
            <View className="w-5 h-5">
              {isDark ? <AppleLightIcon width={20} height={20} /> : <AppleDarkIcon width={20} height={20} />}
            </View>
            <Text className="text-base font-semibold text-white dark:text-slate-900 ml-3">
              Continuar con Apple
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
