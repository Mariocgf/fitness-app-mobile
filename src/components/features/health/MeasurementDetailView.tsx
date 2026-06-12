import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BodyMeasurementDto } from "@/src/types/health";

cssInterop(Ionicons, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]}. ${year}`;
};

const formatCapturedAt = (iso: string): string => {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${day} de ${month}. ${year} a las ${hh}:${mm}`;
};

function CompositionChip({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 px-2">
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold">
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

function MeasurementRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: number;
  isLast: boolean;
}) {
  const display = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return (
    <View
      className={`flex-row items-center justify-between py-3.5 ${
        !isLast ? "border-b border-slate-100 dark:border-slate-800" : ""
      }`}
    >
      <Text className="text-slate-700 dark:text-slate-300 text-base">
        {label}
      </Text>
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-slate-900 dark:text-slate-50 text-base font-semibold">
          {display}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm"> cm</Text>
      </View>
    </View>
  );
}

const PERIMETER_FIELDS: { key: keyof BodyMeasurementDto; label: string }[] = [
  { key: "waistCm", label: "Cintura" },
  { key: "neckCm", label: "Cuello" },
  { key: "hipCm", label: "Cadera" },
  { key: "chestCm", label: "Pecho" },
  { key: "armCm", label: "Brazo" },
  { key: "forearmCm", label: "Antebrazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Pantorrilla" },
];

interface MeasurementDetailViewProps {
  measurement: BodyMeasurementDto;
  onBack: () => void;
  onPressCompare?: () => void;
}

export function MeasurementDetailView({
  measurement,
  onBack,
  onPressCompare,
}: MeasurementDetailViewProps) {
  const hasComposition =
    measurement.weightKg != null ||
    measurement.bodyFatPercentage != null ||
    measurement.leanMassKg != null;

  const perimeterRows = PERIMETER_FIELDS.filter(
    (f) => measurement[f.key] != null,
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4 gap-1">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="p-1 -ml-1"
        >
          <Ionicons
            name="chevron-back"
            size={28}
            className="text-slate-900 dark:text-slate-50"
          />
        </TouchableOpacity>
        <Text className="flex-1 text-slate-900 dark:text-slate-50 text-xl font-bold">
          Detalle de medición
        </Text>
        {onPressCompare != null && (
          <TouchableOpacity
            onPress={onPressCompare}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 px-3 py-1.5 bg-rose-600 dark:bg-rose-500 rounded-full"
          >
            <Ionicons name="swap-horizontal" size={16} className="text-white" />
            <Text className="text-white text-sm font-semibold">Comparar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pb-10 gap-4">
          {/* Fecha y hora de registro */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-1.5 h-7 bg-rose-600 dark:bg-rose-400 rounded-full" />
              <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold">
                {formatDate(measurement.date)}
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-sm ml-4">
              Registrado el {formatCapturedAt(measurement.capturedAt)}
            </Text>
          </View>

          {/* Composición corporal */}
          {hasComposition && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <Text className="text-slate-900 dark:text-slate-50 font-semibold text-base mb-3">
                Composición corporal
              </Text>
              <View className="flex-row gap-3">
                {measurement.weightKg != null && (
                  <CompositionChip
                    value={measurement.weightKg.toFixed(1)}
                    unit=" kg"
                    label="Peso"
                  />
                )}
                {measurement.bodyFatPercentage != null && (
                  <CompositionChip
                    value={measurement.bodyFatPercentage.toFixed(1)}
                    unit="%"
                    label="Grasa corporal"
                  />
                )}
                {measurement.leanMassKg != null && (
                  <CompositionChip
                    value={measurement.leanMassKg.toFixed(1)}
                    unit=" kg"
                    label="Masa magra"
                  />
                )}
              </View>
            </View>
          )}

          {/* Medidas perimetrales */}
          {perimeterRows.length > 0 && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <Text className="text-slate-900 dark:text-slate-50 font-semibold text-base mb-1">
                Medidas perimetrales
              </Text>
              {perimeterRows.map((field, index) => (
                <MeasurementRow
                  key={field.key}
                  label={field.label}
                  value={measurement[field.key] as number}
                  isLast={index === perimeterRows.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
