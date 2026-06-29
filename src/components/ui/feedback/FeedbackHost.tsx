import React from 'react';

import { ConfirmHost } from './ConfirmHost';
import { ToastHost } from './ToastHost';

/**
 * Monta los dos hosts de feedback (toasts + diálogo de confirmación) en un solo
 * lugar. Va en el layout raíz, dentro de SafeAreaProvider.
 */
export function FeedbackHost() {
  return (
    <>
      <ConfirmHost />
      <ToastHost />
    </>
  );
}
