import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

interface CountdownOverlayProps {
  /** Se dispara cuando el "3, 2, 1, ¡YA!" termina de reproducirse. */
  onFinish: () => void;
}

// En web `lottie-react-native` no renderiza confiable (y su onAnimationFinish no dispara),
// así que en vez del Lottie hacemos una cuenta regresiva numérica propia. Además de verse,
// garantiza que la sesión arranque. Metro usa este archivo SOLO en web por la extensión
// `.web.tsx`; el bundle nativo sigue con `CountdownOverlay.tsx` (Lottie) sin cambios.
const STEPS = ['3', '2', '1', '¡YA!'];
const STEP_MS = 800;

export function CountdownOverlay({ onFinish }: CountdownOverlayProps) {
  const [index, setIndex] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (index >= STEPS.length) {
      if (!firedRef.current) {
        firedRef.current = true;
        onFinish();
      }
      return;
    }
    const timeout = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const label = STEPS[Math.min(index, STEPS.length - 1)];

  return (
    <View className="absolute inset-0 bg-zinc-950 items-center justify-center z-50">
      <Text style={{ color: '#d9f99d', fontSize: 96, fontWeight: '800' }}>
        {label}
      </Text>
    </View>
  );
}
