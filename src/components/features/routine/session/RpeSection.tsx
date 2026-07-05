import { SessionSlider } from '@/src/components/common/SessionSlider';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface RpeSectionProps {
  rpe: number;
  onRpeChange: (value: number) => void;
  onSave: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  canUpdate: boolean;
  isOffline?: boolean;
}

/**
 * Sección de esfuerzo percibido (RPE) de la fase de descanso (dark-only `zinc`).
 * Mantiene el slider y el botón "Actualizar" existentes (no se cambia el flujo de
 * ajuste de carga); solo se migró el estilo de `slate` a `zinc` y el título a la
 * etiqueta uppercase de la maqueta.
 */
export const RpeSection: React.FC<RpeSectionProps> = ({
  rpe,
  onRpeChange,
  onSave,
  disabled = false,
  isLoading = false,
  canUpdate,
  isOffline = false,
}) => {
  return (
    <View>
      <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
        Esfuerzo percibido
      </Text>
      <SessionSlider value={rpe} onValueChange={onRpeChange} min={0} max={10} disabled={disabled || isLoading} forceDark />
      <TouchableOpacity
        className={`w-full h-12 rounded-full items-center justify-center border ${
          canUpdate
            ? 'bg-zinc-50 border-zinc-50'
            : 'bg-zinc-800 border-zinc-700'
        }`}
        disabled={!canUpdate}
        onPress={onSave}
      >
        {isLoading ? (
          <ActivityIndicator color="#18181b" size="small" />
        ) : (
          <Text
            className={`font-medium text-base ${canUpdate ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            Actualizar
          </Text>
        )}
      </TouchableOpacity>
      {isOffline ? (
        <Text className="text-zinc-500 text-xs text-center mt-2">
          Offline: el ajuste de carga se bloquea, pero la sesión se puede guardar.
        </Text>
      ) : null}
    </View>
  );
};
