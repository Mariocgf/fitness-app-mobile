import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ProfileSectionScreenProps {
  /** Título centrado del nav bar (ej. "Fitness", "Equipamiento") */
  title: string;
  /** Contenido de la sección (lista o config) */
  children: React.ReactNode;
}

/**
 * Scaffold compartido de las rutas del Perfil (`app/profile/*`): nav bar (back
 * circular + título centrado) sobre el contenido.
 *
 * Tanto las listas de módulo (Fitness/Nutrición/Salud) como cada config viven en
 * **rutas reales** dentro del stack del Perfil, así el back es `router.back()`
 * nativo: el gesto swipe vuelve a la vista anterior con animación nativa, sin el
 * glitch que producía la navegación por estado + `usePreventRemove`/`gestureEnabled`
 * (ver `agent-implementation-lessons.md`). El guard de "cambios sin guardar" de los
 * configs lo aporta `useUnsavedChangesGuard` dentro de cada config.
 */
export const ProfileSectionScreen: React.FC<ProfileSectionScreenProps> = ({ title, children }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-zinc-950">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 border-b border-zinc-800"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-10 h-10 rounded-full border border-zinc-700 items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={20} className="text-zinc-100" />
        </Pressable>
        <Text className="flex-1 text-center text-base font-semibold text-white mr-10">{title}</Text>
      </View>

      <View className="flex-1">{children}</View>
    </View>
  );
};
