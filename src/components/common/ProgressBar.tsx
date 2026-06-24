import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  /** Paso actual (0-based) */
  currentStep: number;
  /** Total de pasos */
  totalSteps: number;
  /** Si true, usa colores claros para fondos oscuros */
  inverted?: boolean;
}

/**
 * Barra de progreso para onboarding.
 * Muestra segmentos indicando el paso actual.
 * Colores según colors.md.
 * NOTA: Safe area debe ser manejado por el contenedor padre.
 */
export default function ProgressBar({ currentStep, totalSteps, inverted = false }: ProgressBarProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-6 gap-2 py-4 ${
        inverted ? 'bg-transparent' : 'bg-zinc-950'
      }`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              inverted
                ? (isActive || isCompleted ? 'bg-white' : 'bg-white/30')
                : (isActive || isCompleted ? 'bg-zinc-50' : 'bg-zinc-800')
            }`}
          />
        );
      })}
    </View>
  );
}
