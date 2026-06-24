import { usePreventRemove } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Alert } from 'react-native';

/**
 * Guarda los cambios sin guardar de una sub-pantalla que vive en una ruta propia.
 * Si `hasUnsavedChanges` es `true`, intercepta el back (botón del nav bar, gesto
 * swipe nativo o back físico de Android) y pide confirmación antes de salir.
 *
 * Reemplaza el patrón duplicado `backHandlerRef` + `onRegisterBackHandler` que
 * cada config del perfil copiaba para reportar su back a un nav bar compartido.
 * Al ser cada config una ruta real, el back lo maneja la navegación nativa y este
 * hook solo agrega el guard de confirmación.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean, message?: string) {
  const navigation = useNavigation();

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    Alert.alert(
      'Cambios sin guardar',
      message ?? 'Tus cambios no se guardaron. ¿Querés salir de todas formas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir sin guardar',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ]
    );
  });
}
