import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const RADIUS = 74;
const STROKE_WIDTH = 22;
const CENTER = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VISUAL_GAP_PX = 4;
const MIN_PILL_LENGTH = STROKE_WIDTH;
const START_ANGLE = 90;

interface RingSegment {
  key: string;
  color: string;
  visualLength: number;
}

interface DrawableRingSegment extends RingSegment {
  startAngle: number;
  pathLength: number;
}

const polarToCartesian = (angle: number) => {
  const angleInRadians = (angle * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(angleInRadians),
    y: CENTER + RADIUS * Math.sin(angleInRadians),
  };
};

const lengthToDegrees = (length: number) => (length / CIRCUMFERENCE) * 360;

const describeArc = (startAngle: number, pathLength: number): string => {
  const sweepAngle = lengthToDegrees(pathLength);
  const endAngle = startAngle + sweepAngle;
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;
  return [
    `M ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
  ].join(' ');
};

export interface MacroRingProps {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  /** Calorías totales que determinan el tamaño máximo del anillo */
  targetCalories: number;
  /** Texto principal en el centro del anillo */
  centerTop: string;
  /** Texto secundario en el centro (ej: "kcal") */
  centerBottom?: string;
  /** Tamaño del SVG en px (default 250) */
  size?: number;
}

/**
 * Anillo SVG de macros reutilizable.
 * Proteína = azul, Carbohidratos = naranja, Grasa = verde.
 */
export function MacroRing({
  proteinGrams,
  carbsGrams,
  fatGrams,
  targetCalories,
  centerTop,
  centerBottom,
  size = 250,
}: MacroRingProps) {
  const proteinKcal = Math.max(proteinGrams, 0) * 4;
  const carbsKcal = Math.max(carbsGrams, 0) * 4;
  const fatKcal = Math.max(fatGrams, 0) * 9;
  const macroKcal = proteinKcal + carbsKcal + fatKcal;
  const hasConsumedMacros = targetCalories > 0 && macroKcal > 0;
  const remainingCalories = Math.max(targetCalories - macroKcal, 0);
  const hasRemainingCalories = hasConsumedMacros && remainingCalories > 0;

  const macroSegments: RingSegment[] = hasConsumedMacros
    ? [
        {
          key: 'fat',
          color: '#10b981',
          visualLength: Math.max(CIRCUMFERENCE * (fatKcal / targetCalories), MIN_PILL_LENGTH),
        },
        {
          key: 'carbs',
          color: '#f97316',
          visualLength: Math.max(CIRCUMFERENCE * (carbsKcal / targetCalories), MIN_PILL_LENGTH),
        },
        {
          key: 'protein',
          color: '#3b82f6',
          visualLength: Math.max(CIRCUMFERENCE * (proteinKcal / targetCalories), MIN_PILL_LENGTH),
        },
      ].filter((s) => s.visualLength > 0)
    : [];

  const visibleSegmentCount = macroSegments.length + (hasRemainingCalories ? 1 : 0);
  const totalGapLength = hasConsumedMacros ? VISUAL_GAP_PX * visibleSegmentCount : 0;
  const maxDrawableLength = Math.max(CIRCUMFERENCE - totalGapLength, 0);
  const totalMacroVisualLength = macroSegments.reduce((t, s) => t + s.visualLength, 0);
  const scale =
    totalMacroVisualLength > 0 && !hasRemainingCalories
      ? maxDrawableLength / totalMacroVisualLength
      : totalMacroVisualLength > maxDrawableLength
        ? maxDrawableLength / totalMacroVisualLength
        : 1;

  const normalizedSegments = macroSegments.map((s) => ({
    ...s,
    visualLength: s.visualLength * scale,
  }));
  const normalizedLength = normalizedSegments.reduce((t, s) => t + s.visualLength, 0);

  const ringSegments: RingSegment[] = hasConsumedMacros
    ? [
        ...normalizedSegments,
        ...(hasRemainingCalories
          ? [
              {
                key: 'remaining',
                color: '#e2e8f0',
                visualLength: Math.max(CIRCUMFERENCE - normalizedLength - totalGapLength, 0),
              },
            ]
          : []),
      ].filter((s) => s.visualLength > 0)
    : [];

  let currentAngle = START_ANGLE;
  const drawableSegments: DrawableRingSegment[] = ringSegments
    .map((segment) => {
      const startAngle =
        currentAngle +
        lengthToDegrees(VISUAL_GAP_PX / 2) +
        lengthToDegrees(STROKE_WIDTH / 2);
      const pathLength = Math.max(segment.visualLength - STROKE_WIDTH, 0.1);
      currentAngle += lengthToDegrees(segment.visualLength + VISUAL_GAP_PX);
      return { ...segment, startAngle, pathLength };
    })
    .filter((s) => s.pathLength > 0);

  const remainingSegment = drawableSegments.find((s) => s.key === 'remaining');
  const macroDrawableSegments = drawableSegments.filter((s) => s.key !== 'remaining');

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {!hasConsumedMacros ? (
          <Circle
            cx="100"
            cy="100"
            r={RADIUS}
            stroke="#e2e8f0"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeLinecap="round"
          />
        ) : (
          <>
            {remainingSegment && (
              <Path
                d={describeArc(remainingSegment.startAngle, remainingSegment.pathLength)}
                stroke={remainingSegment.color}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeLinecap="round"
              />
            )}
            {macroDrawableSegments.map((segment) => (
              <Path
                key={segment.key}
                d={describeArc(segment.startAngle, segment.pathLength)}
                stroke={segment.color}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeLinecap="round"
              />
            ))}
          </>
        )}
      </Svg>

      <View className="absolute items-center">
        <Text className="text-slate-900 dark:text-slate-50 text-3xl font-bold">
          {centerTop}
        </Text>
        {centerBottom && (
          <Text className="text-slate-900 dark:text-slate-300 text-base font-bold -mt-1">
            {centerBottom}
          </Text>
        )}
      </View>
    </View>
  );
}
