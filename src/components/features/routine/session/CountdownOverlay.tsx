import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import countdownAnimation from '@/assets/svg/countdown.json';

interface CountdownOverlayProps {
  /** Se dispara cuando el "3, 2, 1, GO" termina de reproducirse. */
  onFinish: () => void;
}

/**
 * Cuenta regresiva a pantalla completa que se reproduce una sola vez
 * antes de arrancar la sesión. Usa el Lottie `countdown.json` (5s, 3-2-1-GO).
 *
 * `loop={false}` es obligatorio: sin eso la animación reinicia y
 * `onAnimationFinish` nunca se dispara.
 */
export function CountdownOverlay({ onFinish }: CountdownOverlayProps) {
  return (
    <View className="absolute inset-0 bg-zinc-950 items-center justify-center z-50">
      <LottieView
        source={countdownAnimation}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        resizeMode="contain"
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}
