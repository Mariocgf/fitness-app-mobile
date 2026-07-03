import { Picker } from '@react-native-picker/picker';
import React, { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';

export interface WheelPickerProps {
  /** Etiqueta de la métrica (ej. "Peso", "Altura") */
  label: string;
  /** Valor seleccionado */
  value: number;
  /** Callback al cambiar el valor */
  onChange: (value: number) => void;
  /** Valor mínimo del rango */
  min: number;
  /** Valor máximo del rango */
  max: number;
  /** Incremento entre valores (default 1) */
  step?: number;
  /** Unidad mostrada (ej. "kg", "cm") */
  unit: string;
  /** Alto del wheel en iOS (default 180). Bajar para que entren varios en pantalla. */
  wheelHeight?: number;
  /** Color de acento del valor grande (default 'mono' = blanco) */
  accent?: 'lime' | 'amber' | 'mono';
}

/** Alto de la fila resaltada central */
const ROW_HEIGHT = 44;

/** Color del valor grande según el acento del módulo */
const ACCENT_VALUE_COLOR: Record<NonNullable<WheelPickerProps['accent']>, string> = {
  lime: '#a3e635',
  amber: '#fbbf24',
  mono: '#ffffff',
};

/**
 * Selector de valor numérico con el control NATIVO del SO:
 * - iOS: wheel vertical girable (`UIPickerView`).
 * - Android: dropdown/diálogo nativo (`Spinner`) — Android stock no tiene wheel.
 *
 * Reutilizar SIEMPRE para elegir un número de un rango (peso, altura, edad…) en
 * vez de cablear `Picker` + display de valor inline. Es nativo, por lo que no
 * pelea con el responder system de un `ScrollView` padre (a diferencia de un
 * wheel JS, que sí entraría en conflicto de gesto).
 */
export default function WheelPicker({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  wheelHeight = 180,
  accent = 'mono',
}: WheelPickerProps) {
  const isIOS = Platform.OS === 'ios';
  const valueColor = ACCENT_VALUE_COLOR[accent];
  // En 'mono' la unidad queda tenue (zinc-400) como antes; con acento toma el color del módulo.
  const unitColor = accent === 'mono' ? '#a1a1aa' : valueColor;

  const items = useMemo(() => {
    const out: number[] = [];
    for (let v = min; v <= max; v += step) out.push(v);
    return out;
  }, [min, max, step]);

  return (
    <View>
      {/* Etiqueta */}
      <Text className="text-base text-zinc-400 text-center">{label}</Text>

      {/* Valor grande */}
      <View className="flex-row items-end justify-center mt-0.5 mb-1">
        <Text className="text-4xl font-bold" style={{ color: valueColor }}>{value}</Text>
        <Text className="text-lg ml-2 mb-1" style={{ color: unitColor }}>{unit}</Text>
      </View>

      {/* Wheel (iOS) / dropdown (Android) */}
      <View
        className="flex-row items-center"
        style={{ height: isIOS ? wheelHeight : 56 }}
      >
        {isIOS && (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 bg-zinc-800 rounded-xl"
            style={{ top: wheelHeight / 2 - ROW_HEIGHT / 2, height: ROW_HEIGHT }}
          />
        )}

        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(Number(v))}
          style={{ flex: 2, color: '#ffffff' }}
          itemStyle={{ color: '#ffffff', fontSize: 22 }}
          dropdownIconColor="#a1a1aa"
        >
          {items.map((v) => (
            <Picker.Item key={v} label={String(v)} value={v} color="#ffffff" />
          ))}
        </Picker>

        {isIOS && (
          <>
            <View className="w-px bg-zinc-700" style={{ height: ROW_HEIGHT }} />
            <View className="flex-1 items-center justify-center">
              <Text className="text-xl text-white">{unit}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
