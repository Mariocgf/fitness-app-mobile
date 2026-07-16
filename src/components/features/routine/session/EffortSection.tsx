import { EffortSelector } from '@/src/components/common/EffortSelector';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface EffortSectionProps {
  /** Título de la sección. Default: la pregunta del descanso. */
  title?: string;
  /** Esfuerzo de la serie; `null` si el usuario no tocó nada. */
  rpe: number | null;
  onRpeChange: (value: number) => void;
  onAdjustLoad: () => void;
  canAdjustLoad: boolean;
  isAdjustingLoad: boolean;
  isOffline?: boolean;
}

/**
 * Registrar el esfuerzo y ajustar la carga son DOS acciones, y esa separación es el
 * corazón del diseño:
 *
 * - El esfuerzo es un HECHO que el usuario registra. No cambia el peso de la barra.
 * - El ajuste es una QUEJA ("esta carga está mal calibrada") y exige un tap explícito.
 *
 * El botón de ajustar se habilita solo si hay al menos una serie con esfuerzo registrado
 * DESDE el último ajuste: cada ajuste necesita una observación nueva que lo respalde
 * (el backend acumula los ajustes, así que insistir sin entrenar bajaría la carga varias
 * veces respondiendo a la misma observación).
 */
export const EffortSection: React.FC<EffortSectionProps> = ({
  title = '¿Cómo te fue esta serie?',
  rpe,
  onRpeChange,
  onAdjustLoad,
  canAdjustLoad,
  isAdjustingLoad,
  isOffline = false,
}) => {
  /* Cuando el botón está deshabilitado, se explica el porqué en vez de dejarlo mudo. */
  const hint = isOffline
    ? 'Offline: el ajuste de carga necesita conexión. La sesión igual se guarda.'
    : !canAdjustLoad && !isAdjustingLoad
      ? 'Registrá el esfuerzo de una serie para poder ajustar la carga.'
      : null;

  return (
    <View>
      <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
        {title}
      </Text>

      <EffortSelector value={rpe} onChange={onRpeChange} disabled={isAdjustingLoad} />

      <TouchableOpacity
        className={`w-full h-12 rounded-full items-center justify-center border mt-4 ${
          canAdjustLoad ? 'border-lime-400 bg-lime-400/10' : 'border-zinc-800 bg-zinc-900'
        }`}
        disabled={!canAdjustLoad}
        onPress={onAdjustLoad}
      >
        {isAdjustingLoad ? (
          <ActivityIndicator color="#a3e635" size="small" />
        ) : (
          <Text
            className={`font-medium text-base ${canAdjustLoad ? 'text-lime-400' : 'text-zinc-600'}`}
          >
            Ajustar la carga
          </Text>
        )}
      </TouchableOpacity>

      {hint ? (
        <Text className="text-zinc-500 text-xs text-center mt-2">{hint}</Text>
      ) : null}
    </View>
  );
};
