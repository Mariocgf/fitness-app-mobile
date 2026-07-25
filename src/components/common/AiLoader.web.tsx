import Lottie from 'lottie-react';
import React from 'react';
import { Text, View } from 'react-native';

import aiLoaderAnimation from '@/assets/svg/food_loader.json';
import type { AiLoaderProps } from './AiLoader';

/**
 * Variante WEB de `AiLoader`. `lottie-react-native` no renderiza en web, así que usamos
 * `lottie-react` (motor lottie-web) con el MISMO `food_loader.json` → diseño idéntico al
 * nativo. Metro elige este archivo solo en web por la extensión `.web.tsx`; el bundle
 * nativo sigue usando `AiLoader.tsx`. Mismo patrón que `CountdownOverlay.web.tsx`.
 */
export default function AiLoader({ title, subtitle, size = 220 }: AiLoaderProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Lottie
        animationData={aiLoaderAnimation}
        loop
        autoplay
        // lottie-web pinta sobre un <svg> sin fondo propio; lo dejamos explícito para
        // que ningún estilo heredado le meta un color detrás.
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
      />
      <Text className="text-white text-xl font-bold text-center mt-2">{title}</Text>
      {subtitle && (
        <Text className="text-zinc-400 text-base text-center mt-2 leading-relaxed">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
