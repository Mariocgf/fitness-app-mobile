import Lottie from 'lottie-react';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

import countdownAnimation from '@/assets/svg/countdown.json';

interface CountdownOverlayProps {
  /** Se dispara cuando el "3, 2, 1, GO" termina de reproducirse. */
  onFinish: () => void;
}

// Colchón por si `onComplete` de lottie-web no dispara: garantiza el arranque de la sesión.
const FALLBACK_MS = 5500;

/**
 * Variante WEB de la cuenta regresiva. `lottie-react-native` no renderiza en web, así que
 * usamos `lottie-react` (motor lottie-web) con el MISMO `countdown.json` → diseño idéntico
 * al nativo. El JSON va empaquetado en el bundle, así que anda offline sin pedir red.
 * Metro elige este archivo solo en web por la extensión `.web.tsx`; el bundle nativo sigue
 * con `CountdownOverlay.tsx` (lottie-react-native) sin cambios.
 */
export function CountdownOverlay({ onFinish }: CountdownOverlayProps) {
  // Garantiza un único disparo de onFinish (onComplete + timer pueden competir).
  const firedRef = useRef(false);

  const finishOnce = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    const timeout = setTimeout(finishOnce, FALLBACK_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="absolute inset-0 bg-zinc-950 items-center justify-center z-50">
      <Lottie
        animationData={countdownAnimation}
        loop={false}
        autoplay
        onComplete={finishOnce}
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}
