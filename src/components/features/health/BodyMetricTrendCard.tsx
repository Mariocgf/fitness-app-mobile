import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { BodyMetricPoint, BodyMetricTrend } from '@/src/types/health';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const CHART_WIDTH = 280;
const CHART_HEIGHT = 112;
const CHART_PADDING = 14;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Formatea valores manteniendo un decimal solo cuando aporta información. */
const formatNumber = (value: number): string => (
  Number.isInteger(value) ? value.toString() : value.toFixed(1)
);

/** Formatea fechas YYYY-MM-DD a una etiqueta corta para la gráfica. */
const formatShortDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

/** Convierte puntos de dominio a coordenadas del sparkline SVG. */
const buildChartCoordinates = (points: BodyMetricPoint[]): string => {
  if (points.length === 0) return '';

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  return points
    .map((point, index) => {
      const x = points.length === 1
        ? CHART_WIDTH / 2
        : CHART_PADDING + (index * innerWidth) / (points.length - 1);
      const y = points.length === 1
        ? CHART_HEIGHT / 2
        : CHART_PADDING + ((max - point.value) / range) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');
};

function TrendChange({
  value,
  unit,
  percentage,
}: {
  value: number | null;
  unit: string;
  percentage: number | null;
}) {
  if (value == null && percentage == null) return null;

  const direction = value == null || value === 0 ? 'same' : value > 0 ? 'up' : 'down';
  const iconName = direction === 'up' ? 'trending-up' : direction === 'down' ? 'trending-down' : 'remove';
  const colorClass = direction === 'up'
    ? 'text-amber-600 dark:text-amber-300'
    : direction === 'down'
      ? 'text-emerald-600 dark:text-emerald-300'
      : 'text-slate-500 dark:text-slate-400';
  const bgClass = direction === 'up'
    ? 'bg-amber-50 dark:bg-amber-950/40'
    : direction === 'down'
      ? 'bg-emerald-50 dark:bg-emerald-950/40'
      : 'bg-slate-100 dark:bg-slate-800';

  const sign = value != null && value > 0 ? '+' : '';
  const percentSign = percentage != null && percentage > 0 ? '+' : '';

  return (
    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${bgClass}`}>
      <Ionicons name={iconName} size={13} className={colorClass} />
      <Text className={`text-xs font-semibold ${colorClass}`}>
        {value != null ? `${sign}${formatNumber(value)} ${unit}` : ''}
        {value != null && percentage != null ? ' · ' : ''}
        {percentage != null ? `${percentSign}${formatNumber(percentage)}%` : ''}
      </Text>
    </View>
  );
}

interface BodyMetricTrendCardProps {
  trend: BodyMetricTrend;
}

/** Card de tendencia para una métrica corporal con sparkline SVG. */
export function BodyMetricTrendCard({ trend }: BodyMetricTrendCardProps) {
  const points = trend.points ?? [];
  const chartPoints = buildChartCoordinates(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
            {trend.label}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Tendencia de {points.length} registro{points.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {trend.latestValue != null && (
          <View className="items-end">
            <View className="flex-row items-baseline gap-0.5">
              <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold">
                {formatNumber(trend.latestValue)}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {trend.unit}
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-xs">
              último valor
            </Text>
          </View>
        )}
      </View>

      {points.length === 0 ? (
        <View className="h-28 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4">
          <Ionicons
            name="analytics-outline"
            size={24}
            className="text-slate-400 dark:text-slate-500"
          />
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2">
            Sin datos suficientes para graficar esta métrica.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          <View className="h-32 bg-rose-50 dark:bg-slate-950 rounded-2xl px-2 py-2">
            <Svg width="100%" height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
              <Line
                x1={CHART_PADDING}
                y1={CHART_HEIGHT - CHART_PADDING}
                x2={CHART_WIDTH - CHART_PADDING}
                y2={CHART_HEIGHT - CHART_PADDING}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <Polyline
                points={chartPoints}
                fill="none"
                stroke="#e11d48"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {points.length === 1 && (
                <Circle
                  cx={CHART_WIDTH / 2}
                  cy={CHART_HEIGHT / 2}
                  r="5"
                  fill="#e11d48"
                />
              )}
            </Svg>
          </View>

          {firstPoint != null && lastPoint != null && (
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {formatShortDate(firstPoint.date)}
              </Text>
              <TrendChange
                value={trend.absoluteChange}
                unit={trend.unit}
                percentage={trend.percentageChange}
              />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {formatShortDate(lastPoint.date)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
