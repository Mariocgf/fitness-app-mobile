import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import countdownAnimation from '@/assets/svg/countdown.json';

interface CountdownOverlayProps {
  /** Se dispara cuando el "3, 2, 1, GO" termina de reproducirse. */
  onFinish: () => void;
}

// Duración del Lottie (5s) + colchón. En web `onAnimationFinish` de lottie-react-native
// no dispara confiable, así que sin este fallback la sesión NUNCA arranca y queda pantalla
// negra. El timer garantiza el arranque; en nativo el callback de Lottie llega antes y el
// overlay se desmonta, limpiando el timer (nunca se dobla).
const FALLBACK_MS = 5500;

/**
 * Cuenta regresiva a pantalla completa que se reproduce una sola vez
 * antes de arrancar la sesión. Usa el Lottie `countdown.json` (5s, 3-2-1-GO).
 *
 * `loop={false}` es obligatorio: sin eso la animación reinicia y
 * `onAnimationFinish` nunca se dispara.
 */
export function CountdownOverlay({ onFinish }: CountdownOverlayProps) {
  // Garantiza un único disparo de onFinish (timer + callback de Lottie pueden competir).
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
      <LottieView
        source={countdownAnimation}
        autoPlay
        loop={false}
        onAnimationFinish={finishOnce}
        resizeMode="contain"
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}
