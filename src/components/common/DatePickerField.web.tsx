import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import type { DatePickerFieldProps } from './DatePickerField';

/** Acento por defecto del ícono de calendario (rose-400, módulo Salud). */
const DEFAULT_ACCENT = '#fb7185';

/** Formatea una fecha a `YYYY-MM-DD` local para el `<input type="date">`. */
const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parsea `YYYY-MM-DD` a una Date local. Se construye por componentes para evitar
 * el corrimiento de día de `new Date('YYYY-MM-DD')` (que parsea en UTC).
 */
const parseDateInputValue = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

/**
 * Variante web de DatePickerField: el DateTimePicker nativo no tiene build web,
 * así que se usa el date input nativo del navegador (react-native-web lo pinta
 * como DOM). `formatValue` no se usa acá: el input muestra su propia fecha.
 */
export default function DatePickerField({
  value,
  onChange,
  label = 'Fecha',
  maximumDate,
  accentColor = DEFAULT_ACCENT,
}: DatePickerFieldProps) {
  const max = maximumDate ?? new Date();

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
      <Text className="text-white text-lg font-bold mb-1">{label}</Text>
      <View className="flex-row items-center justify-between py-1">
        <input
          type="date"
          value={toDateInputValue(value)}
          max={toDateInputValue(max)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const next = parseDateInputValue(e.target.value);
            if (next) onChange(next);
          }}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: '#d4d4d8',
            border: 'none',
            outline: 'none',
            fontSize: 16,
            colorScheme: 'dark',
          }}
        />
        <Ionicons name="calendar-outline" size={22} color={accentColor} />
      </View>
    </View>
  );
}
