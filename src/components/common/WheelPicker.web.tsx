import React from 'react';
import { Text, View } from 'react-native';

import type { WheelPickerProps } from './WheelPicker';

/** Color del valor grande según el acento del módulo (espejo del nativo). */
const ACCENT_VALUE_COLOR: Record<NonNullable<WheelPickerProps['accent']>, string> = {
  lime: '#a3e635',
  amber: '#fbbf24',
  mono: '#ffffff',
};

/**
 * Variante web de WheelPicker: el Picker nativo (`@react-native-picker/picker`)
 * se pinta en web como un `<select>` claro (texto blanco sobre fondo blanco =
 * ilegible, la caja blanca rota). Se reemplaza por un slider nativo del navegador
 * (`<input type="range">`), que es la forma web natural de elegir un número en un
 * rango y en desktop se arrastra con el mouse. El valor grande se muestra igual
 * que en nativo y se actualiza al arrastrar. Metro resuelve el archivo por
 * extensión; el bundle web no importa el Picker nativo.
 */
export default function WheelPicker({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  accent = 'mono',
}: WheelPickerProps) {
  const valueColor = ACCENT_VALUE_COLOR[accent];
  // En 'mono' la unidad queda tenue (zinc-400) como en nativo; con acento toma el color del módulo.
  const unitColor = accent === 'mono' ? '#a1a1aa' : valueColor;

  return (
    <View>
      {/* Etiqueta */}
      <Text className="text-base text-zinc-400 text-center">{label}</Text>

      {/* Valor grande */}
      <View className="flex-row items-end justify-center mt-0.5 mb-3">
        <Text className="text-4xl font-bold" style={{ color: valueColor }}>
          {value}
        </Text>
        <Text className="text-lg ml-2 mb-1" style={{ color: unitColor }}>
          {unit}
        </Text>
      </View>

      {/* Slider nativo del navegador */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: valueColor,
          cursor: 'pointer',
        }}
      />

      {/* Referencia de extremos del rango */}
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-zinc-500">{min}</Text>
        <Text className="text-xs text-zinc-500">{max}</Text>
      </View>
    </View>
  );
}
