import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

interface GradientTextProps {
  /** Texto a renderizar con relleno de gradiente */
  children: string;
  /** Clases de tipografía (tamaño/peso/leading/tracking). El color lo aporta el gradiente */
  className?: string;
  /**
   * Paradas del gradiente. Default: plata neutro (zinc) que da profundidad sin
   * salirse de la paleta de la app.
   */
  colors?: readonly [string, string, ...string[]];
  /** Punto inicial del gradiente (0–1) */
  start?: { x: number; y: number };
  /** Punto final del gradiente (0–1) */
  end?: { x: number; y: number };
}

/** Gradiente plata neutro por defecto (zinc-50 → zinc-300 → zinc-500) */
const DEFAULT_COLORS = ['#fafafa', '#d4d4d8', '#71717a'] as const;

/**
 * Texto con relleno de gradiente. Usa `MaskedView` (forma del texto) + `LinearGradient`
 * (color). El `Text` interno invisible le da las dimensiones al gradiente.
 * Funciona en Expo Go (masked-view es parte del SDK de Expo).
 */
export function GradientText({
  children,
  className,
  colors = DEFAULT_COLORS,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text className={className} style={{ backgroundColor: 'transparent' }}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={colors} start={start} end={end}>
        {/* Texto invisible: solo define el tamaño del área del gradiente */}
        <Text className={className} style={{ opacity: 0 }}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
