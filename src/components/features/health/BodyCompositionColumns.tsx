import React from "react";
import { Text, View } from "react-native";

/** Item de una columna de composición corporal (Peso / Grasa / Masa magra). */
export interface CompositionItem {
  label: string;
  value: string;
  unit: string;
}

/** Columna individual: etiqueta arriba, valor + unidad abajo. */
function CompositionColumn({ label, value, unit }: CompositionItem) {
  return (
    <View className="flex-1">
      <Text className="text-zinc-400 text-sm mb-1">{label}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-white text-3xl font-bold">{value}</Text>
        <Text className="text-zinc-400 text-sm font-medium">{unit}</Text>
      </View>
    </View>
  );
}

interface BodyCompositionColumnsProps {
  items: CompositionItem[];
  className?: string;
}

/**
 * Fila de columnas de composición corporal separadas por divisores verticales `zinc-800`.
 * Átomo compartido entre `LastMeasurementCard` (dashboard de Salud) y
 * `MeasurementDetailView` (detalle de medición). Reutilizar SIEMPRE en vez de
 * copiar el `flex-row` con `CompositionColumn` + divisor.
 */
export function BodyCompositionColumns({
  items,
  className,
}: BodyCompositionColumnsProps) {
  if (items.length === 0) return null;

  return (
    <View className={`flex-row ${className ?? ""}`}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <View className="w-px self-stretch bg-zinc-800" />}
          <CompositionColumn
            label={item.label}
            value={item.value}
            unit={item.unit}
          />
        </React.Fragment>
      ))}
    </View>
  );
}
