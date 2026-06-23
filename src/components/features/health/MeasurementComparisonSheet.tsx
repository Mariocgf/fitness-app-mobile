import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import {
  BodyMeasurementDto,
  MeasurementComparison,
  MeasurementMetricDelta,
} from '@/src/types/health';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const ROSE = '#fb7185'; // rose-400 — acento del módulo Salud

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatShortDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}. ${year}`;
};

/** Formatea un número: entero sin decimales, no-entero con un decimal. */
const formatValue = (n: number): string => (n % 1 === 0 ? n.toString() : n.toFixed(1));

/** Cambio firmado con signo explícito (ej. "-15", "+18"). */
const formatDiff = (diff: number): string =>
  `${diff > 0 ? '+' : diff < 0 ? '-' : ''}${formatValue(Math.abs(diff))}`;

/**
 * Métricas destacadas en la card resumen (las 3 de la maqueta).
 * Se muestran solo las presentes en ambos registros; si ninguna lo está,
 * cae a las primeras 3 deltas disponibles para no dejar la card vacía.
 */
const HIGHLIGHT_KEYS: (keyof BodyMeasurementDto)[] = ['weightKg', 'bodyFatPercentage', 'waistCm'];

function selectHighlights(deltas: MeasurementMetricDelta[]): MeasurementMetricDelta[] {
  const highlights = HIGHLIGHT_KEYS.map((key) => deltas.find((d) => d.key === key)).filter(
    (d): d is MeasurementMetricDelta => d != null,
  );
  return highlights.length > 0 ? highlights : deltas.slice(0, 3);
}

/** Columna de la card resumen: etiqueta arriba, "viejo → nuevo" y unidad debajo. */
function SummaryColumn({ delta }: { delta: MeasurementMetricDelta }) {
  return (
    <View className="flex-1 items-center px-1">
      <Text className="text-zinc-400 text-sm mb-1.5">{delta.label}</Text>
      <View className="flex-row items-baseline gap-1.5">
        <Text className="text-white text-2xl font-bold">{formatValue(delta.baseValue)}</Text>
        <Ionicons name="arrow-forward" size={14} className="text-zinc-500" />
        <Text className="text-rose-400 text-2xl font-bold">{formatValue(delta.targetValue)}</Text>
      </View>
      <Text className="text-zinc-400 text-sm mt-1">{delta.unit}</Text>
    </View>
  );
}

/** Fila de la lista "Cambios en tus mediciones": etiqueta, viejo↓nuevo y el cambio firmado. */
function ChangeRow({ delta, isLast }: { delta: MeasurementMetricDelta; isLast: boolean }) {
  // Color por DIRECCIÓN (no interpretación de salud): baja = verde, sube = rojo, igual = zinc.
  const changeColor =
    delta.direction === 'down'
      ? 'text-green-400'
      : delta.direction === 'up'
        ? 'text-red-400'
        : 'text-zinc-500';

  const arrowName = delta.direction === 'up' ? 'arrow-up' : 'arrow-down';

  return (
    <View className={`flex-row items-center py-5 ${!isLast ? 'border-b border-zinc-800' : ''}`}>
      {/* Etiqueta */}
      <Text className="flex-1 text-white text-base">{delta.label}</Text>

      {/* Centro: viejo ↓/↑ nuevo */}
      <View className="flex-1 items-center">
        <Text className="text-white text-lg">
          {formatValue(delta.baseValue)} {delta.unit}
        </Text>
        {delta.direction !== 'same' && (
          <Ionicons name={arrowName} size={16} className="text-zinc-500 my-0.5" />
        )}
        <Text className="text-rose-400 text-lg">
          {formatValue(delta.targetValue)} {delta.unit}
        </Text>
      </View>

      {/* Cambio firmado */}
      <View className="flex-1 items-end">
        <Text className="text-zinc-500 text-sm">Cambio:</Text>
        <Text className={`${changeColor} text-lg font-semibold mt-0.5`}>
          {formatDiff(delta.diff)} {delta.unit}
        </Text>
      </View>
    </View>
  );
}

interface MeasurementComparisonSheetProps {
  comparison: MeasurementComparison | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

/**
 * Bottom sheet con el feedback de comparación entre dos registros (dark `zinc`/`rose-400`,
 * rediseñado desde la maqueta). El contenedor lo monta solo cuando corresponde.
 */
export function MeasurementComparisonSheet({
  comparison,
  isLoading,
  error,
  onClose,
}: MeasurementComparisonSheetProps) {
  const highlights = comparison ? selectHighlights(comparison.deltas) : [];

  return (
    <BottomSheetModal visible onClose={onClose} height="88%">
      {/* Header: back circular + título + fechas (más reciente primero, como la maqueta) */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center mr-3"
            accessibilityRole="button"
            accessibilityLabel="Cerrar comparación"
          >
            <Ionicons name="chevron-back" size={22} color={ROSE} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Comparación de mediciones</Text>
            {comparison && (
              <Text className="text-zinc-400 text-sm mt-0.5">
                {formatShortDate(comparison.target.date)} vs {formatShortDate(comparison.base.date)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ROSE} />
          <Text className="text-zinc-400 text-sm mt-3">Cargando registro...</Text>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color={ROSE} />
          <Text className="text-white text-base font-semibold mt-3 text-center">
            No se pudo cargar
          </Text>
          <Text className="text-zinc-400 text-sm mt-1 text-center">{error}</Text>
        </View>
      )}

      {/* Contenido */}
      {comparison && !isLoading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        >
          {comparison.deltas.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-zinc-400 text-base text-center">
                No hay métricas en común entre estos dos registros.
              </Text>
            </View>
          ) : (
            <>
              {/* Resumen: métricas destacadas */}
              {highlights.length > 0 && (
                <View className="flex-row bg-zinc-900 border border-zinc-800 rounded-3xl px-2 py-5 mt-2">
                  {highlights.map((delta, index) => (
                    <React.Fragment key={delta.key as string}>
                      {index > 0 && <View className="w-px self-stretch bg-zinc-800" />}
                      <SummaryColumn delta={delta} />
                    </React.Fragment>
                  ))}
                </View>
              )}

              {/* Lista de cambios */}
              <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2 mt-4">
                <Text className="text-white text-xl font-bold mt-4 mb-1">
                  Cambios en tus mediciones
                </Text>
                {comparison.deltas.map((delta, index) => (
                  <ChangeRow
                    key={delta.key as string}
                    delta={delta}
                    isLast={index === comparison.deltas.length - 1}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}
