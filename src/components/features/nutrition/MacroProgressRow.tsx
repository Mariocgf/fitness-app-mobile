import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { FillBar } from '@/src/components/common/FillBar';
import { IconTile } from '@/src/components/common/IconTile';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MacroProgressRowProps {
  /** Ícono representativo del macro */
  icon: IoniconName;
  /** Nombre del macro (ej. "Proteínas") */
  label: string;
  /** Gramos consumidos */
  value: number;
  /** Gramos objetivo */
  target: number;
}

/**
 * Fila de progreso de un macro: tile + nombre, valor `consumido / objetivo g`
 * y barra de progreso. Acento amber-400 del módulo nutrición.
 */
export function MacroProgressRow({ icon, label, value, target }: MacroProgressRowProps) {
  const safeTarget = Math.max(target, 0);
  const progress = safeTarget > 0 ? Math.min(value / safeTarget, 1) : 0;

  return (
    <View className="flex-row items-center gap-4">
      <IconTile name={icon} />

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-base font-semibold">{label}</Text>
          <Text className="text-zinc-400 text-base">
            <Text className="text-white font-semibold">{Math.round(value)}</Text>
            {` / ${Math.round(safeTarget)} g`}
          </Text>
        </View>

        <FillBar progress={progress} />
      </View>
    </View>
  );
}
