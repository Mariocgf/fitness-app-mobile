import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  NutritionDayDto,
  NutritionTargetDto,
} from '@/src/types/nutrition';

const RADIUS = 74;
const STROKE_WIDTH = 22;
const CENTER = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VISUAL_GAP_PX = 4;
const MIN_PILL_LENGTH = STROKE_WIDTH;
const START_ANGLE = 90; // Abajo-centro: desde acá crecen las píldoras hacia la izquierda en sentido horario.

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

interface MacroPillProps {
  label: string;
  value: number;
  target: number;
  className: string;
}

function MacroPill({ label, value, target, className }: MacroPillProps) {
  return (
    <View className="items-center flex-1">
      <View className={`px-3 py-2 rounded-full mb-2 min-w-[104px] items-center ${className}`}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          className="text-white text-sm font-bold"
        >
          {label}
        </Text>
      </View>
      <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
        {Math.round(value)}
      </Text>
      <Text className="text-slate-900 dark:text-slate-300 text-xs">
        /{Math.round(target)} g
      </Text>
    </View>
  );
}

interface CalorieRingCardProps {
  day: NutritionDayDto;
  target: NutritionTargetDto;
}

/**
 * Card principal con progreso visual de calorías y macros.
 */
export function CalorieRingCard({ day, target }: CalorieRingCardProps) {
  const targetCalories = Math.max(target.calories, 0);
  const proteinKcal = Math.max(day.totalProteinGrams, 0) * 4;
  const carbsKcal = Math.max(day.totalCarbsGrams, 0) * 4;
  const fatKcal = Math.max(day.totalFatGrams, 0) * 9;
  const macroKcal = proteinKcal + carbsKcal + fatKcal;
  const consumedCalories = Math.max(day.totalCalories, macroKcal);
  const hasConsumedMacros = targetCalories > 0 && macroKcal > 0;
  const remainingCalories = Math.max(targetCalories - consumedCalories, 0);
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
      ].filter((segment) => segment.visualLength > 0)
    : [];

  const visibleSegmentCount = macroSegments.length + (hasRemainingCalories ? 1 : 0);
  const totalGapLength = hasConsumedMacros ? VISUAL_GAP_PX * visibleSegmentCount : 0;
  const maxDrawableLength = Math.max(CIRCUMFERENCE - totalGapLength, 0);
  const totalMacroVisualLength = macroSegments.reduce((total, segment) => total + segment.visualLength, 0);
  const scale = totalMacroVisualLength > 0 && !hasRemainingCalories
    ? maxDrawableLength / totalMacroVisualLength
    : totalMacroVisualLength > maxDrawableLength
      ? maxDrawableLength / totalMacroVisualLength
      : 1;
  const normalizedMacroSegments = macroSegments.map((segment) => ({
    ...segment,
    visualLength: segment.visualLength * scale,
  }));
  const normalizedMacroLength = normalizedMacroSegments.reduce((total, segment) => total + segment.visualLength, 0);
  const ringSegments: RingSegment[] = hasConsumedMacros
    ? [
        ...normalizedMacroSegments,
        ...(hasRemainingCalories
          ? [{
              key: 'remaining',
              color: '#e2e8f0',
              visualLength: Math.max(CIRCUMFERENCE - normalizedMacroLength - totalGapLength, 0),
            }]
          : []),
      ].filter((segment) => segment.visualLength > 0)
    : [];

  let currentAngle = START_ANGLE;

  const drawableSegments: DrawableRingSegment[] = ringSegments
    .map((segment) => {
      const startAngle = currentAngle + lengthToDegrees(VISUAL_GAP_PX / 2) + lengthToDegrees(STROKE_WIDTH / 2);
      const pathLength = Math.max(segment.visualLength - STROKE_WIDTH, 0.1);

      currentAngle += lengthToDegrees(segment.visualLength + VISUAL_GAP_PX);

      return {
        ...segment,
        startAngle,
        pathLength,
      };
    })
    .filter((segment) => segment.pathLength > 0);

  const remainingSegment = drawableSegments.find((segment) => segment.key === 'remaining');
  const macroDrawableSegments = drawableSegments.filter((segment) => segment.key !== 'remaining');

  return (
    <View className="bg-white dark:bg-slate-900 rounded-[32px] mx-4 p-6">
      <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
        Calorías
      </Text>

      <View className="items-center justify-center">
        <Svg width={250} height={250} viewBox="0 0 200 200">
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
            {Math.round(day.totalCalories)}
          </Text>
          {hasConsumedMacros && targetCalories > 0 && (
            <Text className="text-slate-500 dark:text-slate-400 text-base -mt-1">
              {Math.round(targetCalories)}
            </Text>
          )}
          <Text className="text-slate-900 dark:text-slate-300 text-base font-bold -mt-1">kcal</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <MacroPill
          label="Proteína"
          value={day.totalProteinGrams}
          target={target.proteinGrams}
          className="bg-blue-500"
        />
        <MacroPill
          label="Carbohidratos"
          value={day.totalCarbsGrams}
          target={target.carbsGrams}
          className="bg-orange-500"
        />
        <MacroPill
          label="Grasa"
          value={day.totalFatGrams}
          target={target.fatGrams}
          className="bg-emerald-500"
        />
      </View>
    </View>
  );
}
