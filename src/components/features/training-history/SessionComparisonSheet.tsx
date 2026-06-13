import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { SessionMetricDelta, TrainingSessionComparison } from '@/src/types/training-history';
import { formatDurationLong, formatSessionDate } from '@/src/utils/training-history.utils';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/** Formatea el valor numérico de una métrica para mostrar en la fila */
function formatMetricValue(delta: SessionMetricDelta, value: number): string {
  if (delta.key === 'duration') return formatDurationLong(value);
  if (delta.unit === 'kg' && value > 0) {
    return value % 1 === 0 ? `${value}` : value.toFixed(1);
  }
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}

/** Formatea la diferencia de una métrica para mostrar como delta */
function formatMetricDiff(delta: SessionMetricDelta): string {
  const sign = delta.diff >= 0 ? '+' : '-';
  const abs = Math.abs(delta.diff);

  if (delta.key === 'duration') return `${sign}${formatDurationLong(abs)}`;
  const num = abs % 1 === 0 ? `${abs}` : abs.toFixed(1);
  const unit = delta.unit ? ` ${delta.unit}` : '';
  return `${sign}${num}${unit}`;
}

/** Fila de una métrica con valor base → target y delta */
function DeltaRow({ delta, isLast }: { delta: SessionMetricDelta; isLast: boolean }) {
  const arrowName =
    delta.direction === 'up' ? 'arrow-up' : delta.direction === 'down' ? 'arrow-down' : 'remove';

  const deltaColor =
    delta.direction === 'up'
      ? 'text-lime-600 dark:text-lime-400'
      : delta.direction === 'down'
        ? 'text-slate-500 dark:text-slate-400'
        : 'text-slate-400 dark:text-slate-500';

  const iconColor =
    delta.direction === 'up'
      ? 'text-lime-600 dark:text-lime-400'
      : delta.direction === 'down'
        ? 'text-slate-500 dark:text-slate-400'
        : 'text-slate-400 dark:text-slate-500';

  const pctDisplay =
    delta.percentChange != null && delta.key !== 'duration'
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
        <Text className="text-slate-500 dark:text-slate-400 text-sm">
          {formatMetricValue(delta, delta.baseValue)}
        </Text>
        {delta.unit && delta.key !== 'duration' && (
          <Text className="text-slate-400 dark:text-slate-500 text-xs">{delta.unit}</Text>
        )}
        <Ionicons name="arrow-forward" size={12} className="text-slate-400 dark:text-slate-500" />
        <Text className="text-slate-900 dark:text-slate-50 text-sm font-semibold">
          {formatMetricValue(delta, delta.targetValue)}
        </Text>
        {delta.unit && delta.key !== 'duration' && (
          <Text className="text-slate-500 dark:text-slate-400 text-xs">{delta.unit}</Text>
        )}
      </View>

      {/* Delta con flecha */}
      <View className="flex-row items-center ml-3 gap-0.5 min-w-[68px] justify-end">
        {delta.direction !== 'same' && (
          <Ionicons name={arrowName} size={12} className={iconColor} />
        )}
        <Text className={`${deltaColor} text-xs font-medium`}>
          {formatMetricDiff(delta)}
          {pctDisplay}
        </Text>
      </View>
    </View>
  );
}

interface SessionComparisonSheetProps {
  comparison: TrainingSessionComparison | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

/**
 * Bottom sheet con la comparación entre dos sesiones de entrenamiento.
 * El contenedor es responsable de montar este componente solo cuando corresponde.
 */
export function SessionComparisonSheet({
  comparison,
  isLoading,
  error,
  onClose,
}: SessionComparisonSheetProps) {
  return (
    <BottomSheetModal visible onClose={onClose} height="85%">
      {/* Header con fechas */}
      <View className="px-4 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        {comparison ? (
          <>
            <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
              Comparación de sesiones
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
              <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                {formatSessionDate(comparison.base.trainedAt)}
              </Text>
              <Ionicons name="swap-horizontal" size={14} className="text-lime-600 dark:text-lime-400" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                {formatSessionDate(comparison.target.trainedAt)}
              </Text>
            </View>
          </>
        ) : (
          <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
            Comparación de sesiones
          </Text>
        )}
      </View>

      {/* Cargando */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#a3e635" />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-3">
            Cargando sesión...
          </Text>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} className="text-lime-600 dark:text-lime-400" />
          <Text className="text-slate-900 dark:text-slate-50 text-base font-semibold mt-3 text-center">
            No se pudo cargar
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center">
            {error}
          </Text>
        </View>
      )}

      {/* Contenido */}
      {comparison && !isLoading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        >
          {/* Resumen de sesión */}
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mt-4 mb-2">
            Resumen de sesión
          </Text>
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4">
            {comparison.summaryDeltas.map((delta, index) => (
              <DeltaRow
                key={delta.key}
                delta={delta}
                isLast={index === comparison.summaryDeltas.length - 1}
              />
            ))}
          </View>

          {/* Ejercicios en común */}
          {comparison.exerciseDeltas.length > 0 && (
            <>
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mt-5 mb-2">
                Ejercicios en común ({comparison.exerciseDeltas.length})
              </Text>
              {comparison.exerciseDeltas.map((ex) => (
                <View
                  key={ex.exerciseId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 mb-3"
                >
                  {/* Nombre del ejercicio */}
                  <View className="pt-4 pb-2">
                    <Text
                      className="text-slate-900 dark:text-slate-50 font-semibold text-sm"
                      numberOfLines={2}
                    >
                      {ex.exerciseNameEs ?? ex.exerciseName}
                    </Text>
                  </View>
                  <View className="border-t border-slate-100 dark:border-slate-800">
                    {ex.metrics.map((metric, index) => (
                      <DeltaRow
                        key={metric.key}
                        delta={metric}
                        isLast={index === ex.metrics.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Sin ejercicios en común */}
          {comparison.exerciseDeltas.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="barbell-outline" size={32} className="text-slate-300 dark:text-slate-600" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2">
                Estas sesiones no comparten ejercicios en común.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}
