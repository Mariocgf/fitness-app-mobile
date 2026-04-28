import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          // Limpiar flags locales y borradores para que un usuario nuevo no se salte el onboarding
          await AsyncStorage.multiRemove([
            '@onboarding_completed',
            '@onboarding_draft',
            '@onboarding_selected_modules',
            '@onboarding_health_config',
            '@onboarding_fitness_config',
            '@onboarding_nutrition_config',
            '@onboarding_module_config_step'
          ]);
          signOut();
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  // Datos del usuario autenticado con Clerk
  const fullName = user?.fullName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarUrl = user?.imageUrl;

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      {/* Header */}
      <View className="pt-16 pb-4 px-6">
        <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white">
          Perfil
        </Text>
      </View>

      {/* Avatar + Info */}
      <View className="items-center mt-6">
        {/* Círculo decorativo detrás del avatar */}
        <View className="w-36 h-36 rounded-full bg-cyan-50 dark:bg-cyan-900/20 items-center justify-center">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-28 h-28 rounded-full"
            />
          ) : (
            <View className="w-28 h-28 rounded-full bg-cyan-200 dark:bg-cyan-800 items-center justify-center">
              <Text className="text-4xl font-bold text-cyan-700 dark:text-cyan-200">
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Nombre y correo */}
        <View className="mt-6 items-center px-8">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {fullName}
          </Text>
          {email ? (
            <Text className="text-base text-slate-500 dark:text-zinc-400 mt-1">
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Spacer que empuja el botón hacia abajo */}
      <View className="flex-1" />

      {/* Botón de cerrar sesión con padding extra para librar la barra flotante */}
      <View className="px-8 pb-32">
        <TouchableOpacity
          className="bg-red-500 py-4 rounded-2xl items-center shadow-red-500/30"
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-bold tracking-wide">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
