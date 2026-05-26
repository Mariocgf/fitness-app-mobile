import { TrainingHistorySet } from '@/src/types/training-history';
import { formatWeightKg } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface SetsTableProps {
  sets: TrainingHistorySet[];
}

/** Encabezado de columna */
function ColHeader({ label, flex = 1 }: { label: string; flex?: number }) {
  return (
    <Text
      className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase text-center"
      style={{ flex }}
    >
      {label}
    </Text>
  );
}

/**
 * Tabla compacta de sets de un ejercicio.
 * Columnas: # | Reps | Peso | Duración | Completado
 */
export function SetsTable({ sets }: SetsTableProps) {
  if (!sets || sets.length === 0) {
    return (
      <Text className="text-slate-400 dark:text-slate-500 text-xs italic mt-1">
        Sin datos de sets
      </Text>
    );
  }

  return (
    <View className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <View className="flex-row bg-slate-100 dark:bg-slate-800 px-3 py-2">
        <ColHeader label="#" flex={0.5} />
        <ColHeader label="Reps" />
        <ColHeader label="Peso" />
        <ColHeader label="Dur." />
        <ColHeader label="✓" flex={0.8} />
      </View>

      {/* Filas */}
      {sets.map((set, index) => (
        <View
          key={set.setNumber}
          className={`flex-row px-3 py-2.5 items-center ${
            index % 2 === 0
              ? 'bg-white dark:bg-slate-900'
              : 'bg-slate-50 dark:bg-slate-800/50'
          }`}
        >
          <Text className="text-slate-500 dark:text-slate-400 text-xs text-center" style={{ flex: 0.5 }}>
            {set.setNumber}
          </Text>
          <Text className="text-slate-900 dark:text-slate-50 text-xs font-medium text-center" style={{ flex: 1 }}>
            {set.repsPerformed > 0 ? set.repsPerformed : '—'}
          </Text>
          <Text className="text-slate-900 dark:text-slate-50 text-xs font-medium text-center" style={{ flex: 1 }}>
            {formatWeightKg(set.weightUsed)}
          </Text>
          <Text className="text-slate-900 dark:text-slate-50 text-xs font-medium text-center" style={{ flex: 1 }}>
            {set.durationSeconds > 0 ? `${set.durationSeconds}s` : '—'}
          </Text>
          <View style={{ flex: 0.8 }} className="items-center">
            {set.isCompleted ? (
              <Ionicons name="checkmark-circle" size={16} color="#a3e635" />
            ) : (
              <Text className="text-slate-400 dark:text-slate-600 text-sm">—</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
