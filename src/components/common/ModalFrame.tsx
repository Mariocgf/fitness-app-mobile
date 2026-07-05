import type { PropsWithChildren } from 'react';

/**
 * En nativo el contenido de un Modal debe ocupar toda la pantalla del celular,
 * así que este wrapper es un passthrough. En web se sustituye por
 * `ModalFrame.web.tsx`, que confina el contenido a la columna tipo móvil.
 */
export function ModalFrame({ children }: PropsWithChildren) {
  return <>{children}</>;
}
