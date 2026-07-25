import LottieView from 'lottie-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import aiLoaderAnimation from '@/assets/svg/food_loader.json';

export interface AiLoaderProps {
  /** Título principal (ej: "Generando tu plan"). */
  title: string;
  /** Línea secundaria opcional para explicar la espera. */
  subtitle?: string;
  /** Lado del cuadro de la animación. */
  size?: number;
}

/**
 * Indicador de "la IA está trabajando": Lottie en loop + mensaje. Se usa mientras se
 * genera contenido con IA, donde la espera es de varios segundos y un spinner genérico
 * no comunica que hay un proceso largo.
 *
 * `loop` va en `true` (a diferencia de `CountdownOverlay`): acá la duración la marca
 * la respuesta del backend, no la animación, así que tiene que repetirse hasta que
 * el estado de carga se apague.
 *
 * La animación actual (`food_loader.json`) es temática de Nutrición. Si Fitness lo
 * reusa, conviene pasar el `source` por prop en vez de meter un segundo componente
 * gemelo; hoy hay un solo consumidor y parametrizarlo sería complejidad sin uso.
 *
 * Formato `.json` y no `.lottie`: el bundle nativo usa `lottie-react-native`, que
 * consume Lottie JSON, mientras que `@lottiefiles/dotlottie-react` es solo web. El
 * mismo archivo alimenta ambas plataformas (igual que `countdown.json`), así el diseño
 * es idéntico y va empaquetado, sin pedir red.
 */
export default function AiLoader({ title, subtitle, size = 220 }: AiLoaderProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* `renderMode="SOFTWARE"`: la animación usa track mattes (`tt`), y con el
          renderer por hardware lottie-android los dibuja en una capa offscreen que
          suele dejar un recuadro/fondo visible alrededor del área matteada. El modo
          software los compone bien. Cuesta algo de performance, aceptable para un
          loader chico que corre unos segundos. */}
      <LottieView
        source={aiLoaderAnimation}
        autoPlay
        loop
        renderMode="SOFTWARE"
        resizeMode="contain"
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
