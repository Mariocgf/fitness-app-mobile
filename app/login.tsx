import { logger } from '@/src/utils/logger';
import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppleIcon from '@/assets/svg/Apple_dark.svg';
import GoogleIcon from '@/assets/svg/google.svg';
import { GradientText } from '@/src/components/common/GradientText';
import { SocialAuthButton } from '@/src/components/features/auth/SocialAuthButton';

// Esto es para que en Android se cierre el navegador web cuando termina el flujo seguro
WebBrowser.maybeCompleteAuthSession();

/** Color zinc neutro de los íconos/labels de features (login no es un módulo, ver colors.md) */
const FEATURE_ICON_COLOR = '#d4d4d8'; // zinc-300

/** Features de la app destacados en la bienvenida (íconos consistentes con el tab bar) */
const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'barbell-outline', label: 'Entrenamiento' },
  { icon: 'restaurant-outline', label: 'Nutrición' },
  { icon: 'heart-outline', label: 'Salud' },
];

/** Columna de feature: ícono + etiqueta, usada en la fila de bienvenida */
function FeatureColumn({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={30} color={FEATURE_ICON_COLOR} />
      <Text className="text-zinc-400 text-sm mt-3">{label}</Text>
    </View>
  );
}

/** Pantalla de bienvenida y autenticación social */
export default function LoginScreen() {
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
      logger.error('Error de OAuth', err);
      if (err?.e?.toUpperCase() === "You're already signed in".toUpperCase()) {
        Linking.createURL('/(tabs)');
      }
      Alert.alert('Interrumpido', 'No se pudo iniciar sesión con esta red.');
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <SafeAreaView className="flex-1 px-6">
        {/* Bloque hero centrado: wordmark + título + subtítulo + features */}
        <View className="flex-1 justify-center">
          <Text className="text-center text-zinc-500 text-base font-semibold tracking-[8px] mb-8">
            WELLIUM
          </Text>

          <View className="items-center">
            <Text className="text-white text-6xl font-extrabold leading-[1.05] tracking-tight">
              Entrena.
            </Text>
            <Text className="text-white text-6xl font-extrabold leading-[1.05] tracking-tight">
              Aliméntate.
            </Text>
            <GradientText
              className="text-6xl font-extrabold leading-[1.05] tracking-tight"
              colors={['#c4b5fd', '#818cf8', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
            >
              Evoluciona.
            </GradientText>
          </View>

          <Text className="text-center text-zinc-500 text-lg leading-relaxed mt-8">
            Fitness, nutrición y salud{'\n'}en una sola aplicación.
          </Text>

          {/* Fila de features con divisores verticales */}
          <View className="flex-row items-center mt-16">
            {FEATURES.map((feature, index) => (
              <View key={feature.label} className="flex-1 flex-row items-center">
                {index > 0 && <View className="w-px h-12 bg-zinc-800" />}
                <FeatureColumn icon={feature.icon} label={feature.label} />
              </View>
            ))}
          </View>
        </View>

        {/* Botones de autenticación social */}
        <View className="pb-4 gap-4">
          <SocialAuthButton
            label="Continuar con Google"
            icon={<GoogleIcon width={20} height={20} />}
            variant="light"
            onPress={() => onSocialLoginPress('oauth_google')}
          />

          {Platform.OS === 'ios' && (
            <SocialAuthButton
              label="Continuar con Apple"
              icon={<AppleIcon width={20} height={20} />}
              variant="dark"
              onPress={() => onSocialLoginPress('oauth_apple')}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
