import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { MeasurementComparison, MeasurementMetricDelta } from '@/src/types/health';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const formatShortDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}. ${year}`;
};

/** Fila de una métrica con valor base, valor objetivo, dirección y porcentaje de cambio */
function DeltaRow({ delta, isLast }: { delta: MeasurementMetricDelta; isLast: boolean }) {
  const arrowName =
    delta.direction === 'up'
      ? 'arrow-up'
      : delta.direction === 'down'
        ? 'arrow-down'
        : 'remove';

  const baseDisplay =
    delta.baseValue % 1 === 0 ? delta.baseValue.toString() : delta.baseValue.toFixed(1);
  const targetDisplay =
    delta.targetValue % 1 === 0 ? delta.targetValue.toString() : delta.targetValue.toFixed(1);
  const diffDisplay =
    delta.diff >= 0
      ? `+${Math.abs(delta.diff) % 1 === 0 ? Math.abs(delta.diff) : Math.abs(delta.diff).toFixed(1)}`
      : `-${Math.abs(delta.diff) % 1 === 0 ? Math.abs(delta.diff) : Math.abs(delta.diff).toFixed(1)}`;
  const pctDisplay =
    delta.percentChange != null
      ? ` (${delta.percentChange >= 0 ? '+' : ''}${delta.percentChange.toFixed(1)}%)`
      : '';

  return (
    <View
      className={`flex-row items-center py-3.5 ${
        !isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''
      }`}
    >
      {/* Etiqueta */}
      <Text className="flex-1 text-slate-700 dark:text-slate-300 text-sm">{delta.label}</Text>

      {/* Valores: base → target */}
      <View className="flex-row items-center gap-1">
        <Text className="text-slate-500 dark:text-slate-400 text-sm">{baseDisplay}</Text>
        <Ionicons name="arrow-forward" size={12} className="text-slate-400 dark:text-slate-500" />
        <Text className="text-slate-900 dark:text-slate-50 text-sm font-semibold">
          {targetDisplay}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs ml-0.5">{delta.unit}</Text>
      </View>

      {/* Delta con flecha y porcentaje */}
      <View className="flex-row items-center ml-3 gap-0.5 min-w-[64px] justify-end">
        <Ionicons
          name={arrowName}
          size={12}
          className="text-rose-600 dark:text-rose-400"
        />
        <Text className="text-rose-600 dark:text-rose-400 text-xs font-medium">
          {diffDisplay}
          {pctDisplay}
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
 * Bottom sheet con el feedback de comparación entre dos registros.
 * El contenedor es responsable de montar este componente solo cuando corresponde.
 */
export function MeasurementComparisonSheet({
  comparison,
  isLoading,
  error,
  onClose,
}: MeasurementComparisonSheetProps) {
  return (
    <BottomSheetModal visible onClose={onClose} height="80%">
      {/* Header con fechas */}
      <View className="px-4 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        {comparison ? (
          <>
            <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
              Comparación de mediciones
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {formatShortDate(comparison.base.date)}
              </Text>
              <Ionicons name="swap-horizontal" size={14} className="text-rose-600 dark:text-rose-400" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {formatShortDate(comparison.target.date)}
              </Text>
            </View>
          </>
        ) : (
          <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
            Comparación de mediciones
          </Text>
        )}
      </View>

      {/* Contenido */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-3">
            Cargando registro...
          </Text>
        </View>
      )}

      {error && !isLoading && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} className="text-rose-600 dark:text-rose-400" />
          <Text className="text-slate-900 dark:text-slate-50 text-base font-semibold mt-3 text-center">
            No se pudo cargar
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center">
            {error}
          </Text>
        </View>
      )}

      {comparison && !isLoading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        >
          {comparison.deltas.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-slate-500 dark:text-slate-400 text-base text-center">
                No hay métricas en común entre estos dos registros.
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 mt-4">
              {comparison.deltas.map((delta, index) => (
                <DeltaRow
                  key={delta.key as string}
                  delta={delta}
                  isLast={index === comparison.deltas.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}
