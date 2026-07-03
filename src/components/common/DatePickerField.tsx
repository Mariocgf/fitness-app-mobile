import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

/** Acento por defecto del ícono de calendario (rose-400, módulo Salud). */
const DEFAULT_ACCENT = '#fb7185';

export interface DatePickerFieldProps {
  /** Fecha seleccionada. */
  value: Date;
  /** Se invoca con la nueva fecha elegida. */
  onChange: (date: Date) => void;
  /** Formatea la fecha para mostrarla en la fila (cada consumidor trae el suyo). */
  formatValue: (date: Date) => string;
  /** Etiqueta de la card. Default "Fecha". */
  label?: string;
  /** Fecha máxima seleccionable. Default hoy. */
  maximumDate?: Date;
  /** Color del ícono de calendario. Default rose-400. */
  accentColor?: string;
}

/**
 * Campo de selección de fecha (card + fila + picker). En nativo usa el
 * DateTimePicker de la comunidad (spinner iOS / popup Android). La variante web
 * (`DatePickerField.web.tsx`) usa el `<input type="date">` del navegador, porque
 * ese paquete no tiene build web. Metro resuelve el archivo por extensión.
 */
export default function DatePickerField({
  value,
  onChange,
  formatValue,
  label = 'Fecha',
  maximumDate,
  accentColor = DEFAULT_ACCENT,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const max = maximumDate ?? new Date();

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
      <Text className="text-white text-lg font-bold mb-1">{label}</Text>
      <TouchableOpacity
        onPress={() => setShowPicker((s) => !s)}
        className="flex-row items-center justify-between py-1"
      >
        <Text className="text-zinc-300 text-base">{formatValue(value)}</Text>
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={22} color={accentColor} />
          <Ionicons name="chevron-forward" size={18} color="#71717a" />
        </View>
      </TouchableOpacity>

      {showPicker &&
        (Platform.OS === 'ios' ? (
          <View className="items-center">
            <DateTimePicker
              value={value}
              mode="date"
              display="spinner"
              maximumDate={max}
              textColor="#ffffff"
              style={{ width: '100%' }}
              onChange={(_e, d) => {
                if (d) onChange(d);
              }}
            />
          </View>
        ) : (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            maximumDate={max}
            onChange={(_e, d) => {
              setShowPicker(false);
              if (d) onChange(d);
            }}
          />
        ))}
    </View>
  );
}
