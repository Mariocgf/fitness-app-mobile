import * as WebBrowser from 'expo-web-browser';

import { FullPageLoader } from '@/src/components/common/FullPageLoader';

// Ruta de aterrizaje del popup de OAuth. En web, `maybeCompleteAuthSession` corre a nivel
// de módulo (apenas se carga la página) para postear el resultado a la ventana que inició el
// login y cerrar el popup. Sin esto, el popup se queda abierto mostrando la app y la sesión
// nunca vuelve al opener → el sign_in queda "abandoned" en Clerk (no se crea el usuario).
// En nativo es un no-op seguro.
WebBrowser.maybeCompleteAuthSession();

/** Pantalla efímera: solo existe para completar el flujo OAuth y cerrar el popup en web. */
export default function SSOCallbackScreen() {
  return <FullPageLoader message="Completando inicio de sesión..." />;
}
