import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { BodyMetricPoint, BodyMetricTrend } from '@/src/types/health';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/** Acento del módulo Salud en modo oscuro (rose-400). */
const ROSE = '#fb7185';

const CHART_WIDTH = 280;
const CHART_HEIGHT = 64;
const CHART_PADDING = 8;
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

/** Convierte puntos de dominio a coordenadas `{x, y}` del sparkline SVG. */
const buildChartCoordinates = (points: BodyMetricPoint[]): { x: number; y: number }[] => {
  if (points.length === 0) return [];

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  return points.map((point, index) => {
    const x = points.length === 1
      ? CHART_WIDTH / 2
      : CHART_PADDING + (index * innerWidth) / (points.length - 1);
    const y = points.length === 1
      ? CHART_HEIGHT / 2
      : CHART_PADDING + ((max - point.value) / range) * innerHeight;
    return { x, y };
  });
};

/** Texto plano del cambio absoluto centrado bajo la gráfica (ej. "−2.4 kg"). */
function TrendDelta({ value, unit }: { value: number | null; unit: string }) {
  if (value == null) return <Text className="text-zinc-500 text-xs" />;
  // El signo `−` (menos tipográfico) ya comunica la dirección; sin pill ni color.
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const magnitude = formatNumber(Math.abs(value));
  return (
    <Text className="text-zinc-500 text-xs">
      {sign}{magnitude} {unit}
    </Text>
  );
}

interface BodyMetricTrendCardProps {
  trend: BodyMetricTrend;
}

/** Card de tendencia para una métrica corporal con sparkline SVG. */
export function BodyMetricTrendCard({ trend }: BodyMetricTrendCardProps) {
  const points = trend.points ?? [];
  const coords = buildChartCoordinates(points);
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">
            {trend.label}
          </Text>
          <Text className="text-zinc-400 text-sm mt-0.5">
            Último valor
          </Text>
        </View>

        {trend.latestValue != null && (
          <View className="flex-row items-baseline gap-1">
            <Text className="text-white text-2xl font-bold">
              {formatNumber(trend.latestValue)}
            </Text>
            <Text className="text-zinc-400 text-xs font-medium">
              {trend.unit}
            </Text>
          </View>
        )}
      </View>

      {points.length === 0 ? (
        <View className="h-16 items-center justify-center bg-zinc-800 rounded-2xl px-4">
          <Text className="text-zinc-400 text-sm text-center">
            Sin datos suficientes para graficar esta métrica.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <Polyline
              points={polyline}
              fill="none"
              stroke={ROSE}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {/* Puntos en los extremos del recorrido */}
            {firstCoord && (
              <Circle cx={firstCoord.x} cy={firstCoord.y} r="4" fill={ROSE} />
            )}
            {lastCoord && (
              <Circle cx={lastCoord.x} cy={lastCoord.y} r="4" fill={ROSE} />
            )}
          </Svg>

          {firstPoint != null && lastPoint != null && (
            <View className="flex-row items-center justify-between">
              <Text className="text-zinc-500 text-xs">
                {formatShortDate(firstPoint.date)}
              </Text>
              <TrendDelta value={trend.absoluteChange} unit={trend.unit} />
              <Text className="text-zinc-500 text-xs">
                {formatShortDate(lastPoint.date)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
