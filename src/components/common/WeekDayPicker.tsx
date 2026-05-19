import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface WeekDay {
  value: number;
  label: string;
  isWeekend: boolean;
}

interface WeekDayPickerProps {
  /** Lista de días de la semana con su valor, etiqueta y si es fin de semana */
  days: WeekDay[];
  /** Valores seleccionados actualmente */
  selectedDays: number[];
  /** Callback con el nuevo array de días seleccionados */
  onChange: (days: number[]) => void;
  /** Color de relleno para días de fin de semana (default: red-400) */
  weekendColor?: string;
}

/**
 * Selector de días de la semana con pills.
 * Días de semana usan el acento global (zinc-950), fines de semana usan color rojo.
 * Sin sombra — borde slate-200 según design system.
 */
export default function WeekDayPicker({
  days,
  selectedDays,
  onChange,
  weekendColor = '#f87171',
}: WeekDayPickerProps) {
  const toggleDay = (value: number) => {
    onChange(
      selectedDays.includes(value)
        ? selectedDays.filter((d) => d !== value)
        : [...selectedDays, value]
    );
  };

  return (
    <View className="flex-row justify-between">
      {days.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        const isSelectedWeekend = isSelected && day.isWeekend;
        const isSelectedWeekday = isSelected && !day.isWeekend;

        return (
          <TouchableOpacity
            key={day.value}
            onPress={() => toggleDay(day.value)}
            activeOpacity={0.7}
            className={`w-11 h-11 rounded-2xl items-center justify-center border-2 ${
              isSelectedWeekday
                ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
            style={isSelectedWeekend ? { backgroundColor: weekendColor, borderColor: weekendColor } : undefined}
          >
            <Text
              className={`text-sm font-bold ${
                isSelectedWeekday
                  ? 'text-white dark:text-slate-900'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
              style={isSelectedWeekend ? { color: '#ffffff' } : undefined}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
