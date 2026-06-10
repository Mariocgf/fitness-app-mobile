import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { BodyMeasurementDto } from "@/src/types/health";

cssInterop(Ionicons, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

interface LastMeasurementCardProps {
  measurement: BodyMeasurementDto | null;
  onRegister: () => void;
  onViewDetail?: () => void;
}

/** Formatea una fecha YYYY-MM-DD a "8 de jun. 2026" */
const formatDate = (dateStr: string): string => {
  const MONTHS = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]}. ${year}`;
};

/** Chip pequeño con valor numérico + unidad + etiqueta inferior */
function MetricChip({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center bg-slate-100 dark:bg-slate-800 rounded-2xl py-3 px-2">
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
          {value}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">
          {unit}
        </Text>
      </View>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center">
        {label}
      </Text>
    </View>
  );
}

/**
 * Card que muestra la última medición corporal del usuario.
 * Cuando no hay mediciones, muestra un estado vacío con CTA para registrar.
 */
export function LastMeasurementCard({
  measurement,
  onRegister,
  onViewDetail,
}: LastMeasurementCardProps) {
  // ── Estado vacío ─────────────────────────────────────────────────────────
  if (measurement === null) {
    return (
      <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <View className="flex-row items-start mb-4">
          <View className="flex-1 pr-4">
            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
              Medidas corporales
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 leading-5">
              Todavía no tenés mediciones.{"\n"}Registrá tus primeras medidas
              para seguir tu progreso.
            </Text>
          </View>
          <Ionicons
            name="body-outline"
            size={40}
            className="text-slate-900 dark:text-slate-50"
          />
        </View>
        <TouchableOpacity
          onPress={onRegister}
          activeOpacity={0.8}
          className="py-4 rounded-xl items-center bg-rose-600 dark:bg-rose-400"
        >
          <Text className="text-white dark:text-slate-900 font-bold text-base">
            Registrar primera medición
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Con medición ─────────────────────────────────────────────────────────
  const hasComposition =
    measurement.weightKg != null ||
    measurement.bodyFatPercentage != null ||
    measurement.leanMassKg != null;

  // Calcula cuántas medidas perimetrales fueron registradas
  const perimeterCount = [
    measurement.waistCm,
    measurement.neckCm,
    measurement.hipCm,
    measurement.chestCm,
    measurement.armCm,
    measurement.forearmCm,
    measurement.thighCm,
    measurement.calfCm,
  ].filter((v) => v != null).length;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Área de información — tappable para ver detalle */}
      <TouchableOpacity
        onPress={onViewDetail}
        activeOpacity={onViewDetail ? 0.75 : 1}
        disabled={!onViewDetail}
        className="p-5 pb-4"
      >
        {/* Encabezado con título, fecha y flecha */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
            Última medición
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="calendar-outline"
                size={14}
                className="text-slate-500 dark:text-slate-400"
              />
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {formatDate(measurement.date)}
              </Text>
            </View>
            {onViewDetail && (
              <Ionicons
                name="chevron-forward"
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
            )}
          </View>
        </View>

        {/* Chips de composición corporal */}
        {hasComposition && (
          <View className="flex-row gap-2 mb-4">
            {measurement.weightKg != null && (
              <MetricChip
                value={measurement.weightKg.toString()}
                unit="kg"
                label="Peso"
              />
            )}
            {measurement.bodyFatPercentage != null && (
              <MetricChip
                value={measurement.bodyFatPercentage.toFixed(1)}
                unit="%"
                label="Grasa"
              />
            )}
            {measurement.leanMassKg != null && (
              <MetricChip
                value={measurement.leanMassKg.toFixed(1)}
                unit="kg"
                label="Masa magra"
              />
            )}
          </View>
        )}

        {/* Resumen de medidas perimetrales */}
        {perimeterCount > 0 && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name="resize-outline"
              size={14}
              className="text-slate-500 dark:text-slate-400"
            />
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
              {perimeterCount} medida{perimeterCount !== 1 ? "s" : ""} perimetral
              {perimeterCount !== 1 ? "es" : ""} registrada
              {perimeterCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Botón de acción — separado del área tappable */}
      <View className="px-5 pb-5 pt-4">
        <TouchableOpacity
          onPress={onRegister}
          activeOpacity={0.8}
          className="py-4 rounded-xl items-center bg-rose-600 dark:bg-rose-400"
        >
          <Text className="text-white dark:text-slate-900 font-bold text-base">
            Registrar nueva medición
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
