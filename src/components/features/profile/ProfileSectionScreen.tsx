import { Ionicons } from '@expo/vector-icons';
import { usePreventRemove } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/** API que el wrapper expone a la sub-vista (SettingsView) que renderiza. */
interface SectionChildApi {
  /** Registra el back interno del config abierto (o null al cerrarlo). */
  onSubBackChange: (fn: (() => void) | null) => void;
}

interface ProfileSectionScreenProps {
  /** Título centrado del nav bar (ej. "Fitness") */
  title: string;
  /** Render-prop: recibe `onSubBackChange` para enganchar el back interno de los configs */
  children: (api: SectionChildApi) => React.ReactNode;
}

/**
 * Scaffold compartido de las rutas de sección del Perfil (`app/profile/*`).
 * Aporta el nav bar (back + título) y centraliza el manejo del back interno de
 * los configs anidados (Equipamiento, Dieta, etc.), que siguen navegando por
 * estado dentro de la sub-vista.
 *
 * Back: si hay un config abierto (`subBack`), vuelve a la lista del módulo; si no,
 * popea la ruta (vuelve a `profile/index`). Mientras un config está abierto se
 * **deshabilita el gesto swipe nativo** para evitar el glitch de native-stack
 * (el gesto arranca la salida nativa y el JS la cancela con un salto feo); ahí el
 * back se hace con el botón. `usePreventRemove` cubre además el back físico de
 * Android sin glitch.
 */
export const ProfileSectionScreen: React.FC<ProfileSectionScreenProps> = ({ title, children }) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [subBack, setSubBack] = useState<(() => void) | null>(null);

  // Gesto nativo activo solo cuando NO hay config abierto.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !subBack });
  }, [navigation, subBack]);

  // Back físico de Android: si hay config abierto, va a su back interno (no popea).
  usePreventRemove(!!subBack, () => subBack?.());

  const handleBack = () => (subBack ? subBack() : router.back());

  return (
    <View className="flex-1 bg-zinc-950">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 border-b border-zinc-800"
      >
        <Pressable
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-10 h-10 rounded-full border border-zinc-700 items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Ionicons name="chevron-back" size={20} className="text-zinc-100" />
        </Pressable>
        <Text className="flex-1 text-center text-base font-semibold text-white mr-10">{title}</Text>
      </View>

      <View className="flex-1">
        {children({ onSubBackChange: (fn) => setSubBack(fn ? () => fn : null) })}
      </View>
    </View>
  );
};
