import { Text } from 'react-native';

interface GradientTextProps {
  /** Texto a renderizar con relleno de gradiente */
  children: string;
  /** Clases de tipografía (tamaño/peso/leading/tracking). El color lo aporta el gradiente */
  className?: string;
  /** Paradas del gradiente. Default: plata neutro (zinc) */
  colors?: readonly [string, string, ...string[]];
  /** Punto inicial del gradiente (0–1) */
  start?: { x: number; y: number };
  /** Punto final del gradiente (0–1) */
  end?: { x: number; y: number };
}

/** Gradiente plata neutro por defecto (zinc-50 → zinc-300 → zinc-500) */
const DEFAULT_COLORS = ['#fafafa', '#d4d4d8', '#71717a'] as const;

/**
 * Convierte los puntos start/end de `expo-linear-gradient` (fracciones del box, y hacia abajo)
 * al ángulo de `linear-gradient` de CSS (grados horarios desde "to top").
 */
function toCssAngle(start: { x: number; y: number }, end: { x: number; y: number }): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Versión WEB de `GradientText`. En web `@react-native-masked-view` es un stub que descarta
 * el `LinearGradient` y deja el texto sin color (se ve negro). Acá el gradiente se hace con CSS
 * nativo: `background-clip: text` + texto transparente (react-native-web soporta `backgroundClip`
 * y forwardea `backgroundImage`). La tipografía sigue viniendo del `className` de NativeWind.
 */
export function GradientText({
  children,
  className,
  colors = DEFAULT_COLORS,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientTextProps) {
  const angle = toCssAngle(start, end);
  const backgroundImage = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  return (
    <Text
      className={className}
      style={{
        backgroundImage,
        backgroundClip: 'text',
        color: 'transparent',
        // Safari/WebKit: sin esto el gradiente no recorta al texto
        WebkitTextFillColor: 'transparent',
      } as object}
    >
      {children}
    </Text>
  );
}
