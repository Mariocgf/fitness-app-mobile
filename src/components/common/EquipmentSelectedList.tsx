import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { QuantityStepper } from '@/src/components/common/QuantityStepper';

interface EquipmentRow {
  id: string;
  name: string;
  qty: number;
}

interface EquipmentSelectedListProps {
  /** Items seleccionados con su cantidad */
  items: EquipmentRow[];
  /** Se invoca con la nueva cantidad (ya acotada) de un ítem */
  onChangeQty: (id: string, qty: number) => void;
  /** Quita un ítem de la selección */
  onRemove: (id: string) => void;
  /** Limpia toda la selección; si se pasa, muestra "Borrar todas" */
  onClearAll?: () => void;
  /** Acento de los controles de cantidad (default 'mono') */
  accent?: 'lime' | 'amber' | 'mono';
  /** Etiqueta del encabezado (default 'Seleccionadas') */
  label?: string;
  /** Cantidad máxima por ítem (default 99) */
  maxQty?: number;
}

/**
 * Lista de equipamiento seleccionado (dark-only `zinc`): encabezado
 * `Etiqueta (N)` + "Borrar todas" opcional y una fila por ítem con su nombre,
 * un `QuantityStepper` (−/+, mínimo 1) y un botón de papelera para quitarlo.
 *
 * Lista los ítems elegidos con su cantidad editable; el equivalente SIN cantidad
 * lo cubre la lista de seleccionados embebida en `SearchableSelect`.
 * Reutilizar SIEMPRE para mostrar equipamiento elegido en vez de copiar el bloque
 * fila + stepper + papelera (estaba duplicado en onboarding Fitness y perfil).
 */
export default function EquipmentSelectedList({
  items,
  onChangeQty,
  onRemove,
  onClearAll,
  accent = 'mono',
  label = 'Seleccionadas',
  maxQty = 99,
}: EquipmentSelectedListProps) {
  if (items.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-white">
          {label} ({items.length})
        </Text>
        {onClearAll && (
          <TouchableOpacity onPress={onClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm text-zinc-400">Borrar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="gap-3">
        {items.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3"
          >
            <Text className="flex-1 text-base text-white mr-3" numberOfLines={1}>
              {item.name}
            </Text>

            <View className="flex-row items-center gap-3">
              <QuantityStepper
                value={item.qty}
                onChange={(qty) => onChangeQty(item.id, qty)}
                step={1}
                min={1}
                max={maxQty}
                unit=""
                accent={accent}
              />
              <TouchableOpacity
                onPress={() => onRemove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} className="text-zinc-500" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
