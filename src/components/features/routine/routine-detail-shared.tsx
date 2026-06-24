/**
 * Piezas compartidas entre la vista de detalle (lectura/swap) y el modo edición
 * de rutinas. Vive en su propio módulo para que ambos archivos las reutilicen
 * sin imports circulares.
 */
import React from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/* ── Constantes de layout ─────────────────────────────────────────────────── */

export const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 56, default: 49 }) as number;
export const BOTTOM_BUTTON_HEIGHT = 60;

/* ── VersionBadge ── pill chico no interactivo para versionado ────────────── */

interface VersionBadgeProps {
  label: string;
  /** `lime` resalta (En uso / Última); `zinc` es neutro (número de versión). */
  tone?: 'lime' | 'zinc';
}

/**
 * Badge compacto para el versionado de rutinas. No es interactivo (a diferencia
 * de `SelectablePill`), así que vive como átomo propio. Lo usan el header del
 * detalle de rutina y las filas de `RoutineVersionsSheet`.
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({ label, tone = 'zinc' }) => (
  <View
    className={`px-2 py-0.5 rounded-full border ${
      tone === 'lime'
        ? 'bg-lime-400/15 border-lime-400/40'
        : 'bg-white/5 border-white/10'
    }`}
  >
    <Text
      className={`text-[11px] font-semibold ${tone === 'lime' ? 'text-lime-400' : 'text-zinc-300'}`}
    >
      {label}
    </Text>
  </View>
);

/* ── DaySlot ── 3 slots fijos, cross-fade de contenido al deslizar ────────── */

export const SLOT_CONFIGS = [
  { fontSize: 52, color: '#ffffff' },
  { fontSize: 28, color: '#52525b' },
  { fontSize: 18, color: '#3f3f46' },
] as const;

interface DaySlotProps {
  prev: string;
  current: string;
  next: string;
  fontSize: number;
  color: string;
  scrollX: SharedValue<number>;
  baseOffset: SharedValue<number>;
  screenWidth: number;
  /** Si el texto coincide con accent.text, se pinta con accent.color (p.ej. el slot "+ Día"). */
  accent?: { text: string; color: string };
}

export const DaySlot: React.FC<DaySlotProps> = ({
  prev, current, next, fontSize, color, scrollX, baseOffset, screenWidth, accent,
}) => {
  const lineHeight = fontSize * 1.15;
  const tw = { fontWeight: 'bold' as const, fontSize, lineHeight, color };
  const colorOf = (txt: string) => (accent && txt === accent.text ? accent.color : color);

  // Anchos reales de cada texto (prev/current/next), medidos sin restricción.
  const prevW = useSharedValue(0);
  const curW = useSharedValue(0);
  const nxtW = useSharedValue(0);

  const measure = (sv: SharedValue<number>) =>
    (e: { nativeEvent: { layout: { width: number } } }) => {
      sv.value = Math.ceil(e.nativeEvent.layout.width) + 2;
    };

  // El ancho del contenedor INTERPOLA de forma continua con el scroll, en sincronía
  // con el cross-fade. Así sigue siempre al texto visible y el gap nunca "respira".
  const containerStyle = useAnimatedStyle(() => {
    if (curW.value === 0) return {};
    const p = (scrollX.value - baseOffset.value) / screenWidth;
    if (p >= 0) {
      const target = nxtW.value > 0 ? nxtW.value : curW.value;
      return { width: curW.value + (target - curW.value) * Math.min(1, p) };
    }
    const target = prevW.value > 0 ? prevW.value : curW.value;
    return { width: curW.value + (target - curW.value) * Math.min(1, -p) };
  });

  const curOpacity = useAnimatedStyle(() => {
    const p = (scrollX.value - baseOffset.value) / screenWidth;
    return { opacity: 1 - Math.min(1, Math.abs(p)) };
  });
  const nxtOpacity = useAnimatedStyle(() => {
    const p = (scrollX.value - baseOffset.value) / screenWidth;
    return { opacity: Math.max(0, Math.min(1, p)) };
  });
  const prvOpacity = useAnimatedStyle(() => {
    const p = (scrollX.value - baseOffset.value) / screenWidth;
    return { opacity: Math.max(0, Math.min(1, -p)) };
  });

  // Textos de medición: wrapper screenWidth + alignSelf flex-start → miden el ancho REAL
  // del contenido (un View en RN estira sus hijos a lo ancho por defecto).
  const measurerWrap = {
    position: 'absolute' as const, top: 0, left: 0, width: screenWidth, opacity: 0, alignItems: 'flex-start' as const,
  };

  return (
    // flexShrink/flexGrow estáticos: el flex-row padre NO puede encoger el slot.
    <Animated.View style={[{ flexShrink: 0, flexGrow: 0 }, containerStyle]}>
      <View style={measurerWrap} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start' }]} numberOfLines={1} onLayout={measure(prevW)}>{prev || ' '}</Text>
      </View>
      <View style={measurerWrap} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start' }]} numberOfLines={1} onLayout={measure(curW)}>{current || ' '}</Text>
      </View>
      <View style={measurerWrap} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start' }]} numberOfLines={1} onLayout={measure(nxtW)}>{next || ' '}</Text>
      </View>

      {/* Ghost en flujo: aporta la baseline y la altura de una línea (invisible). */}
      <Text style={[tw, { opacity: 0 }]} numberOfLines={1}>{current}</Text>

      {/*
        Overlays visibles: cada uno en su wrapper de screenWidth → el texto nunca wrapea.
        Quedan alineados a la izquierda del slot; el sobrante del wrapper es transparente.
      */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: screenWidth, alignItems: 'flex-start' }, curOpacity]} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start', color: colorOf(current) }]} numberOfLines={1}>{current}</Text>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: screenWidth, alignItems: 'flex-start' }, nxtOpacity]} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start', color: colorOf(next) }]} numberOfLines={1}>{next}</Text>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: screenWidth, alignItems: 'flex-start' }, prvOpacity]} pointerEvents="none">
        <Text style={[tw, { alignSelf: 'flex-start', color: colorOf(prev) }]} numberOfLines={1}>{prev}</Text>
      </Animated.View>
    </Animated.View>
  );
};
