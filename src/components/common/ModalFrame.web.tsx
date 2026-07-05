import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

/**
 * En web, react-native-web renderiza el `Modal` en un `<div>` con
 * `position: fixed; inset: 0` que cubre todo el viewport, escapándose del
 * `AppFrame` de ~480px. Este wrapper vuelve a confinar el contenido del modal
 * a la misma columna tipo móvil, centrada; los gutters quedan sobre el fondo
 * #09090b. Debe ser el hijo directo del `Modal`.
 */
export function ModalFrame({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
      {children}
    </View>
  );
}
