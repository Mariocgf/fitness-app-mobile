import { EFFORT_OPTIONS } from '@/src/utils/rpe';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EffortSelectorProps {
  /** Esfuerzo elegido, o `null` si el usuario todavía no tocó nada. */
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Selector de esfuerzo percibido: 4 categorías, sin preselección.
 *
 * NINGÚN botón viene marcado por defecto, y es a propósito: la gente no cambia los
 * valores por defecto (por inercia, no por acuerdo), así que un "Justo" preseleccionado
 * cosecharía un océano de "Justo" que describe al default, no al usuario. La opción
 * `emphasized` es la más grande y visible, pero igual exige un tap: ese tap convierte
 * una suposición nuestra en una afirmación del usuario.
 *
 * Si el usuario no toca nada, el esfuerzo queda en `null` — nunca en un número inventado.
 *
 * No se reusó `SegmentedControl` porque reparte los segmentos en partes iguales (`flex-1`)
 * y no puede destacar una opción por encima del resto.
 */
export const EffortSelector: React.FC<EffortSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <View className="flex-row gap-2">
    {EFFORT_OPTIONS.map((option) => {
      const isSelected = value === option.value;
      return (
        <TouchableOpacity
          key={option.value}
          onPress={() => onChange(option.value)}
          disabled={disabled}
          activeOpacity={0.8}
          style={{ flex: option.emphasized ? 1.4 : 1 }}
          className={`items-center justify-center rounded-2xl border px-1 ${
            option.emphasized ? 'py-5' : 'py-4'
          } ${isSelected ? 'bg-lime-400 border-lime-400' : 'bg-zinc-900 border-zinc-800'} ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className={`font-semibold ${option.emphasized ? 'text-base' : 'text-sm'} ${
              isSelected ? 'text-zinc-900' : 'text-zinc-300'
            }`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
