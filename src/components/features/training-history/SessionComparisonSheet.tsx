import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import {
  ComparisonVerdict,
  SessionExerciseDelta,
  SessionMetricDelta,
  SessionSetSnapshot,
  TrainingSessionComparison,
} from '@/src/types/training-history';
import {
  formatDurationLong,
  formatSessionDateDots,
  formatWeightKg,
} from '@/src/utils/training-history.utils';

const LIME = '#a3e635';
const ZINC_500 = '#71717a';

type IoniconName = keyof typeof Ionicons.glyphMap;

/* ── Helpers de formato ──────────────────────────────────────────────────── */

/** Valor de una métrica de resumen para la tabla de comparación. */
function formatSummaryValue(key: string, value: number): string {
  if (key === 'duration') return formatDurationLong(value);
  if (key === 'totalVolume') return `${Math.round(value)} kg`;
  return `${value}`;
}

/** Diferencia firmada de una métrica para los mini-stats de "Rendimiento general". */
function formatSignedDelta(delta: SessionMetricDelta): string {
  const sign = delta.diff > 0 ? '+' : '−';
  const abs = Math.abs(delta.diff);
  if (delta.key === 'duration') return `${sign}${formatDurationLong(abs)}`;
  if (delta.key === 'totalVolume') return `${sign}${Math.round(abs)} kg`;
  return `${sign}${abs % 1 === 0 ? abs : abs.toFixed(1)}`;
}

/** Top set como "20 kg × 12" (o "12 reps" si es a peso corporal). */
function formatTopSet(s: SessionSetSnapshot): string {
  if (s.weight > 0) return `${formatWeightKg(s.weight)} × ${s.reps}`;
  return `${s.reps} reps`;
}

/** Texto del cambio destacado de un ejercicio ("+5 kg", "+3 repeticiones") o `null`. */
function formatHeadline(ex: SessionExerciseDelta): string | null {
  if (ex.headlineKind === 'none' || ex.headlineDiff === 0) return null;
  const sign = ex.headlineDiff > 0 ? '+' : '−';
  const abs = Math.abs(ex.headlineDiff);
  if (ex.headlineKind === 'weight') {
    return `${sign}${abs % 1 === 0 ? abs : abs.toFixed(1)} kg`;
  }
  return `${sign}${abs} ${abs === 1 ? 'repetición' : 'repeticiones'}`;
}

/* ── Configuración de presentación ───────────────────────────────────────── */

const VERDICT_META: Record<ComparisonVerdict, { label: string; icon: IoniconName; accent: boolean }> = {
  better: { label: 'Mejor que la sesión anterior', icon: 'trending-up', accent: true },
  worse: { label: 'Por debajo de la sesión anterior', icon: 'trending-down', accent: false },
  similar: { label: 'Sesión similar a la anterior', icon: 'reorder-two-outline', accent: false },
};

const STAT_META: Record<string, { icon: IoniconName; changedLabel: string; noun: string }> = {
  completedSets: { icon: 'reorder-three-outline', changedLabel: 'series completadas', noun: 'Series' },
  duration: { icon: 'stopwatch-outline', changedLabel: 'de duración', noun: 'Duración' },
  totalVolume: { icon: 'barbell-outline', changedLabel: 'de volumen', noun: 'Volumen' },
};

/* ── Subcomponentes (uso único en esta vista) ────────────────────────────── */

/** Mini-stat de "Rendimiento general": ícono en círculo + valor firmado o "sin cambios". */
function PerformanceStat({ delta }: { delta: SessionMetricDelta }) {
  const meta = STAT_META[delta.key];
  const changed = delta.direction !== 'same';
  const icon: IoniconName = changed ? meta.icon : 'reorder-two-outline';

  return (
    <View className="flex-1 flex-row items-center gap-2.5">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center border ${
          changed ? 'border-lime-400/40' : 'border-zinc-700'
        }`}
      >
        <Ionicons name={icon} size={18} color={changed ? LIME : ZINC_500} />
      </View>
      <View className="flex-1">
        {changed ? (
          <>
            <Text className="text-lime-400 text-lg font-bold" numberOfLines={1}>
              {formatSignedDelta(delta)}
            </Text>
            <Text className="text-zinc-500 text-xs" numberOfLines={2}>
              {meta.changedLabel}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-zinc-300 text-sm font-semibold" numberOfLines={1}>
              {meta.noun}
            </Text>
            <Text className="text-zinc-500 text-xs">sin cambios</Text>
          </>
        )}
      </View>
    </View>
  );
}

/** Fila de la tabla "Comparación de sesiones": etiqueta · valor base → valor target. */
function ComparisonRow({ delta, isLast }: { delta: SessionMetricDelta; isLast: boolean }) {
  return (
    <View className={`flex-row items-center py-3.5 ${!isLast ? 'border-b border-zinc-800' : ''}`}>
      <Text className="flex-[1.3] text-zinc-300 text-sm" numberOfLines={1}>
        {delta.label}
      </Text>
      <Text className="flex-1 text-center text-zinc-400 text-base" numberOfLines={1}>
        {formatSummaryValue(delta.key, delta.baseValue)}
      </Text>
      <View className="w-7 items-center">
        <Ionicons name="arrow-forward" size={15} color={ZINC_500} />
      </View>
      <Text className="flex-1 text-center text-lime-400 text-base font-semibold" numberOfLines={1}>
        {formatSummaryValue(delta.key, delta.targetValue)}
      </Text>
    </View>
  );
}

/** Fila de "Ejercicios en común": nombre + top set base → target + cambio destacado. */
function ExerciseDeltaRow({ ex, isLast }: { ex: SessionExerciseDelta; isLast: boolean }) {
  const headline = formatHeadline(ex);
  const positive = ex.headlineDiff > 0;

  return (
    <View className={`py-4 ${!isLast ? 'border-b border-zinc-800' : ''}`}>
      <Text className="text-white text-base font-semibold mb-1.5" numberOfLines={2}>
        {ex.exerciseNameEs ?? ex.exerciseName}
      </Text>
      <View className="flex-row items-center">
        <Text className="text-zinc-400 text-sm">{formatTopSet(ex.baseTopSet)}</Text>
        <Ionicons name="arrow-forward" size={14} color={ZINC_500} style={{ marginHorizontal: 8 }} />
        <Text className="text-lime-400 text-sm font-medium">{formatTopSet(ex.targetTopSet)}</Text>
        <View className="flex-1" />
        {headline && (
          <Text className={`text-sm font-semibold ${positive ? 'text-lime-400' : 'text-zinc-500'}`}>
            {headline}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ── Componente principal ────────────────────────────────────────────────── */

interface SessionComparisonSheetProps {
  comparison: TrainingSessionComparison | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

/**
 * Bottom sheet con la comparación entre dos sesiones de entrenamiento (dark `zinc`/`lime`).
 * El contenedor es responsable de montar este componente solo cuando corresponde.
 */
export function SessionComparisonSheet({
  comparison,
  isLoading,
  error,
  onClose,
}: SessionComparisonSheetProps) {
  const verdict = comparison ? VERDICT_META[comparison.overall] : null;
  const byKey = (key: string) =>
    comparison?.summaryDeltas.find((d) => d.key === key);
  const miniStats = comparison
    ? (['completedSets', 'duration', 'totalVolume']
        .map(byKey)
        .filter(Boolean) as SessionMetricDelta[])
    : [];

  return (
    <BottomSheetModal visible onClose={onClose} height="88%">
      {/* Header: back + título + fechas */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color={LIME} />
          </TouchableOpacity>
          <Text className="flex-1 text-white text-2xl font-bold" numberOfLines={1}>
            Comparación de sesiones
          </Text>
        </View>
        {comparison && (
          <View className="flex-row items-center gap-2 mt-2 ml-[52px]">
            <Text className="text-zinc-400 text-sm" numberOfLines={1}>
              {formatSessionDateDots(comparison.target.trainedAt)}
            </Text>
            <Ionicons name="swap-horizontal" size={16} color={ZINC_500} />
            <Text className="text-zinc-400 text-sm" numberOfLines={1}>
              {formatSessionDateDots(comparison.base.trainedAt)}
            </Text>
          </View>
        )}
      </View>

      {/* Cargando */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={LIME} />
          <Text className="text-zinc-400 text-sm mt-3">Cargando sesión...</Text>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color={LIME} />
          <Text className="text-white text-base font-semibold mt-3 text-center">
            No se pudo cargar
          </Text>
          <Text className="text-zinc-400 text-sm mt-1 text-center">{error}</Text>
        </View>
      )}

      {/* Contenido */}
      {comparison && verdict && !isLoading && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        >
          {/* Rendimiento general */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <Text className="text-white text-lg font-bold mb-4">Rendimiento general</Text>

            <View className="flex-row items-center gap-3 mb-5">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center border ${
                  verdict.accent ? 'border-lime-400/40 bg-lime-400/10' : 'border-zinc-700'
                }`}
              >
                <Ionicons name={verdict.icon} size={24} color={verdict.accent ? LIME : ZINC_500} />
              </View>
              <Text
                className={`flex-1 text-lg font-bold ${
                  verdict.accent ? 'text-lime-400' : 'text-zinc-300'
                }`}
              >
                {verdict.label}
              </Text>
            </View>

            <View className="flex-row">
              {miniStats.map((delta, index) => (
                <React.Fragment key={delta.key}>
                  {index > 0 && <View className="w-px bg-zinc-800 mx-1" />}
                  <PerformanceStat delta={delta} />
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Comparación de sesiones (tabla) */}
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <Text className="text-white text-lg font-bold mb-4">Comparación de sesiones</Text>

            {/* Encabezado de columnas con fechas */}
            <View className="flex-row items-center pb-1">
              <View className="flex-[1.3]" />
              <Text className="flex-1 text-center text-zinc-500 text-xs" numberOfLines={1}>
                {formatSessionDateDots(comparison.base.trainedAt)}
              </Text>
              <View className="w-7" />
              <Text className="flex-1 text-center text-lime-400 text-xs" numberOfLines={1}>
                {formatSessionDateDots(comparison.target.trainedAt)}
              </Text>
            </View>

            {comparison.summaryDeltas.map((delta, index) => (
              <ComparisonRow
                key={delta.key}
                delta={delta}
                isLast={index === comparison.summaryDeltas.length - 1}
              />
            ))}
          </View>

          {/* Ejercicios en común */}
          {comparison.exerciseDeltas.length > 0 ? (
            <View>
              <Text className="text-zinc-500 text-sm mb-3 ml-1">Ejercicios en común</Text>
              <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5">
                {comparison.exerciseDeltas.map((ex, index) => (
                  <ExerciseDeltaRow
                    key={ex.exerciseId}
                    ex={ex}
                    isLast={index === comparison.exerciseDeltas.length - 1}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <Ionicons name="barbell-outline" size={32} color={ZINC_500} />
              <Text className="text-zinc-400 text-sm text-center mt-2">
                Estas sesiones no comparten ejercicios en común.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}
