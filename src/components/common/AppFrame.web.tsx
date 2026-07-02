import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

/**
 * Centra la app en un contenedor tipo móvil (~480px) para el viewport web.
 * `alignSelf: 'center'` la centra dentro del GestureHandlerRootView (flex-1);
 * los gutters muestran el fondo #09090b de #root (definido en app/+html.tsx).
 */
export function AppFrame({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      {children}
    </View>
  );
}
