import React from 'react';
import { Text, View } from 'react-native';

interface MacroPillsProps {
  /** Gramos de proteína. */
  protein: number;
  /** Gramos de carbohidratos. */
  carbs: number;
  /** Gramos de grasas. */
  fat: number;
  /**
   * Variante compacta: labels cortos (`P`/`C`/`G`) a ancho automático, para
   * filas densas como las cards del buscador. Por defecto usa labels largos a
   * ancho completo (`flex-1`), como en la card de alimento registrado.
   */
  compact?: boolean;
}

const FULL_LABELS = { protein: 'Proteína', carbs: 'Carbohidratos', fat: 'Grasas' };
const SHORT_LABELS = { protein: 'P', carbs: 'C', fat: 'G' };

function Pill({
  label,
  grams,
  compact,
}: {
  label: string;
  grams: number;
  compact: boolean;
}) {
  return (
    <View
      className={
        compact
          ? 'bg-zinc-800 rounded-lg px-2.5 py-1'
          : 'flex-1 bg-zinc-800 rounded-xl py-2.5 items-center'
      }
    >
      <Text className="text-zinc-300 text-xs font-medium">
        {label} {Math.round(grams)} g
      </Text>
    </View>
  );
}

/**
 * Fila de pills de macros (Proteína / Carbohidratos / Grasas) de un alimento.
 * Átomo de nutrición reutilizable: evita copiar el `<View rounded><Text/></View>`
 * por cada macro. Usado en la card de alimento registrado y en el buscador.
 */
export function MacroPills({ protein, carbs, fat, compact = false }: MacroPillsProps) {
  const labels = compact ? SHORT_LABELS : FULL_LABELS;

  return (
    <View className="flex-row gap-2">
      <Pill label={labels.protein} grams={protein} compact={compact} />
      <Pill label={labels.carbs} grams={carbs} compact={compact} />
      <Pill label={labels.fat} grams={fat} compact={compact} />
    </View>
  );
}
