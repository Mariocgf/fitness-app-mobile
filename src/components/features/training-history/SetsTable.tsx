import { TrainingHistorySet } from '@/src/types/training-history';
import { formatSetDetail } from '@/src/utils/training-history.utils';
import React from 'react';
import { Text, View } from 'react-native';

interface SetsTableProps {
  sets: TrainingHistorySet[];
}

/**
 * Listado de sets de un ejercicio (dark-only zinc).
 * Cada fila: "Serie N" a la izquierda y "X rep • Y kg" (o "—" si no se completó) a la derecha,
 * dividido por líneas finas. Reemplaza la antigua tabla de columnas por el diseño de la maqueta.
 */
export function SetsTable({ sets }: SetsTableProps) {
  if (!sets || sets.length === 0) {
    return (
      <Text className="text-zinc-500 text-xs italic px-5 py-4">Sin datos de sets</Text>
    );
  }

  return (
    <View>
      {sets.map((set, index) => {
        const incomplete = !set.isCompleted;
        return (
          <View
            key={set.setNumber}
            className={`flex-row items-center justify-between px-5 py-4 ${
              index > 0 ? 'border-t border-zinc-800' : ''
            }`}
          >
            <Text className="text-zinc-300 text-base">Serie {set.setNumber}</Text>
            <Text className={`text-base ${incomplete ? 'text-zinc-600' : 'text-zinc-300'}`}>
              {formatSetDetail(set)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
