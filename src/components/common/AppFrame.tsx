import type { PropsWithChildren } from 'react';

/** En nativo la app ocupa toda la pantalla: passthrough sin envoltura visual. */
export function AppFrame({ children }: PropsWithChildren) {
  return <>{children}</>;
}
