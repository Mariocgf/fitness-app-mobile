import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface WeekDay {
  value: number;
  label: string;
  /** Conservado por compatibilidad con WEEKDAY_OPTIONS; ya no altera el estilo. */
  isWeekend?: boolean;
}

type WeekDayAccent = 'lime' | 'amber' | 'mono';

interface WeekDayPickerProps {
  /** Lista de días de la semana con su valor y etiqueta */
  days: WeekDay[];
  /** Valores seleccionados actualmente */
  selectedDays: number[];
  /** Callback con el nuevo array de días seleccionados */
  onChange: (days: number[]) => void;
  /** Color de acento del día seleccionado (default 'mono') */
  accent?: WeekDayAccent;
}

/** Clases del borde + texto del día seleccionado, por acento (estilo maqueta: círculo bordeado) */
const ACCENT_SELECTED: Record<WeekDayAccent, { border: string; text: string }> = {
  lime: { border: 'border-lime-400', text: 'text-lime-400' },
  amber: { border: 'border-amber-400', text: 'text-amber-400' },
  mono: { border: 'border-zinc-50', text: 'text-zinc-50' },
};

/**
 * Selector de días de la semana con pills circulares (dark-only `zinc`).
 * Seleccionado = círculo bordeado con el acento del módulo + texto del acento;
 * sin seleccionar = `bg-zinc-900 border-zinc-800` con texto `zinc-400`.
 * Rediseñado desde la maqueta de onboarding Fitness (todos los días iguales,
 * sin distinción de fin de semana).
 */
export default function WeekDayPicker({
  days,
  selectedDays,
  onChange,
  accent = 'mono',
}: WeekDayPickerProps) {
  const selected = ACCENT_SELECTED[accent];

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

        return (
          <TouchableOpacity
            key={day.value}
            onPress={() => toggleDay(day.value)}
            activeOpacity={0.7}
            className={`w-11 h-11 rounded-full items-center justify-center border-2 ${
              isSelected
                ? `bg-zinc-900 ${selected.border}`
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                isSelected ? selected.text : 'text-zinc-400'
              }`}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
