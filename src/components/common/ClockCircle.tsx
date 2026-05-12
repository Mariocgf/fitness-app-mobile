import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatTime } from '@/src/utils/format.utils';

/** Reloj circular SVG con anillo de progreso, reutilizable para descanso y ejercicio */

interface ClockCircleProps {
  /** Indica si está en fase de descanso (muestra label "Descanso" y mayor tamaño por defecto) */
  isRestPhase: boolean;
  /** Tiempo restante de descanso en segundos */
  restTimeLeft: number;
  /** Tiempo inicial de descanso (para calcular progreso) */
  initialRest: number;
  /** Tiempo global acumulado de la sesión */
  globalTime: number;
  /** Tamaño personalizado del reloj (diámetro en px) */
  sizeOverride?: number;
  /** Indica si el ejercicio actual es de tipo countdown */
  isExerciseCountdown?: boolean;
  /** Tiempo restante del countdown de ejercicio */
  exerciseTimeLeft?: number;
  /** Duración inicial del ejercicio con countdown */
  exerciseInitialTime?: number;
}

export const ClockCircle: React.FC<ClockCircleProps> = ({
  isRestPhase,
  restTimeLeft,
  initialRest,
  globalTime,
  sizeOverride,
  isExerciseCountdown,
  exerciseTimeLeft,
  exerciseInitialTime,
}) => {
  const size = sizeOverride ? sizeOverride : (isRestPhase ? 240 : 120);
  const strokeWidth = isRestPhase || isExerciseCountdown ? 6 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let progress = 1;
  if (isRestPhase) {
    progress = initialRest > 0 ? restTimeLeft / initialRest : 0;
  } else if (isExerciseCountdown && exerciseInitialTime && exerciseInitialTime > 0 && exerciseTimeLeft !== undefined) {
    progress = exerciseTimeLeft / exerciseInitialTime;
  }
  const strokeDashoffset = circumference - progress * circumference;

  let displayTime = globalTime;
  if (isRestPhase) {
    displayTime = restTimeLeft;
  } else if (isExerciseCountdown && exerciseTimeLeft !== undefined) {
    displayTime = exerciseTimeLeft;
  }

  return (
    <View
      className="items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Anillo de fondo */}
        <Circle
          stroke="#3f3f46"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Anillo de progreso */}
        <Circle
          stroke="#d9f99d"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        {isRestPhase && (
          <Text className="text-zinc-300 text-sm mb-1">Descanso</Text>
        )}
        <Text
          className={`text-white font-bold ${isRestPhase ? 'text-5xl' : 'text-3xl'}`}
        >
          {formatTime(displayTime)}
        </Text>
        {(isRestPhase || isExerciseCountdown) && (
          <Text className="text-zinc-400 text-sm mt-1">
            {formatTime(globalTime)}
          </Text>
        )}
      </View>
    </View>
  );
};
