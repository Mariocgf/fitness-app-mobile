import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface ExerciseTimerCardProps {
  /** Tiempo en segundos a mostrar en formato MM:SS */
  time: number;
  /** Modo cronómetro (reps normales) o cuenta regresiva (ejercicio con tiempo) */
  mode: 'stopwatch' | 'countdown';
  /** Solo para countdown: duración inicial en segundos para calcular el progreso */
  totalDuration?: number;
  /** Etiqueta a la derecha de la barra solo en modo countdown (ej: "00:23") */
  remainingLabel?: string;
}

/** Formatea segundos a MM:SS */
const toMMSS = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Card de timer reutilizable para la fase de ejercicio y descanso.
 * No maneja su propio timer; recibe el tiempo ya calculado desde el padre.
 */
export const ExerciseTimerCard: React.FC<ExerciseTimerCardProps> = ({
  time,
  mode,
  totalDuration,
  remainingLabel,
}) => {
  /**
   * elapsed: 0 → 1 a medida que transcurre el tiempo.
   * Para countdown: elapsed = 1 - time/total (crece al decrecer el tiempo).
   * Para stopwatch: siempre 1 (barra llena estática).
   */
  const initElapsed =
    mode === 'countdown' && totalDuration && totalDuration > 0
      ? 1 - time / totalDuration
      : 1;

  const elapsed = useSharedValue(initElapsed);

  useEffect(() => {
    if (mode === 'countdown' && totalDuration && totalDuration > 0) {
      elapsed.value = withTiming(1 - time / totalDuration, {
        duration: 950,
        easing: Easing.linear,
      });
    } else {
      elapsed.value = 1;
    }
  }, [time, mode, totalDuration]);

  /* Segmento negro crece, segmento gris decrece (flex proporcional) */
  const fillStyle = useAnimatedStyle(() => ({
    flex: Math.max(elapsed.value, 0.001),
  }));
  const remainStyle = useAnimatedStyle(() => ({
    flex: Math.max(1 - elapsed.value, 0.001),
  }));

  return (
    <View className="bg-white dark:bg-slate-900 rounded-b-2xl px-6 pt-6 pb-4">
      {/* Tiempo */}
      <Text className="text-5xl font-black text-center text-slate-900 dark:text-slate-50">
        {toMMSS(time)}
      </Text>

      {/* Barra de progreso */}
      <View className="mt-4">
        {mode === 'countdown' ? (
          /* Countdown: dos segmentos con gap — negro crece, gris decrece */
          <View className="flex-row items-center gap-2">
            <Animated.View style={fillStyle} className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-50" />
            <Animated.View style={remainStyle} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
            {remainingLabel ? (
              <Text className="text-xs text-slate-500 dark:text-slate-400 w-10 text-right">
                {remainingLabel}
              </Text>
            ) : null}
          </View>
        ) : (
          /* Stopwatch: barra negra estática al 100% */
          <View className="w-full h-2 rounded-full bg-zinc-900 dark:bg-zinc-50" />
        )}
      </View>
    </View>
  );
};
