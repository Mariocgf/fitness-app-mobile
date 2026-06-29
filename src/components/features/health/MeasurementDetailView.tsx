import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { BodyMeasurementDto } from "@/src/types/health";

import {
  BodyCompositionColumns,
  CompositionItem,
} from "./BodyCompositionColumns";

const ROSE = "#fb7185"; // rose-400 — acento del módulo Salud

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Formatea "YYYY-MM-DD" a "21 de jun. 2026". */
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]}. ${year}`;
};

/** Extrae solo la hora "18:33" del ISO de captura. */
const formatCapturedTime = (iso: string): string => {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

/** Fila de medida perimetral: etiqueta · · · · valor cm, con leader punteado. */
function PerimeterRow({
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
      className={`flex-row items-center py-4 ${
        !isLast ? "border-b border-zinc-800" : ""
      }`}
    >
      <Text className="text-white text-base">{label}</Text>
      <View className="flex-1 border-b border-dotted border-zinc-700 mx-3 mb-1" />
      <View className="flex-row items-baseline gap-1">
        <Text className="text-white text-base font-medium">{display}</Text>
        <Text className="text-zinc-500 text-sm">cm</Text>
      </View>
    </View>
  );
}

const PERIMETER_FIELDS: { key: keyof BodyMeasurementDto; label: string }[] = [
  { key: "waistCm", label: "Cintura" },
  { key: "neckCm", label: "Cuello" },
  { key: "chestCm", label: "Pecho" },
  { key: "armCm", label: "Brazo" },
  { key: "forearmCm", label: "Antebrazo" },
  { key: "hipCm", label: "Cadera" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Pantorrilla" },
];

interface MeasurementDetailViewProps {
  measurement: BodyMeasurementDto;
  isDeleting?: boolean;
  onBack: () => void;
  onPressCompare?: () => void;
  onDelete?: () => void;
}

export function MeasurementDetailView({
  measurement,
  isDeleting = false,
  onBack,
  onPressCompare,
  onDelete,
}: MeasurementDetailViewProps) {
  const insets = useSafeAreaInsets();

  // Solo se muestran las columnas de composición con dato real.
  const compositionItems: CompositionItem[] = [
    measurement.weightKg != null && {
      label: "Peso",
      value: measurement.weightKg.toString(),
      unit: "kg",
    },
    measurement.bodyFatPercentage != null && {
      label: "Grasa corporal",
      value: measurement.bodyFatPercentage.toFixed(1),
      unit: "%",
    },
    measurement.leanMassKg != null && {
      label: "Masa magra",
      value: measurement.leanMassKg.toFixed(1),
      unit: "kg",
    },
  ].filter(Boolean) as CompositionItem[];

  const perimeterRows = PERIMETER_FIELDS.filter(
    (f) => measurement[f.key] != null,
  );

  return (
    <View className="flex-1 bg-zinc-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4 gap-3">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color={ROSE} />
        </TouchableOpacity>
        <Text className="flex-1 text-white text-2xl font-bold">
          Detalle de medición
        </Text>
        {onPressCompare != null && (
          <TouchableOpacity
            onPress={onPressCompare}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 px-4 py-2 border border-zinc-700 rounded-full"
          >
            <Ionicons name="analytics-outline" size={18} color={ROSE} />
            <Text className="text-zinc-200 text-sm font-semibold">Comparar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24,
        }}
      >
        <View className="px-4 gap-4">
          {/* Fecha y hora de registro */}
          <View className="px-1 mb-1">
            <View className="flex-row items-center gap-2.5">
              <Ionicons name="calendar-outline" size={22} color={ROSE} />
              <Text className="text-white text-2xl font-bold">
                {formatDate(measurement.date)}
              </Text>
            </View>
            <Text className="text-zinc-500 text-sm mt-1 ml-8">
              Registrado a las {formatCapturedTime(measurement.capturedAt)}
            </Text>
          </View>

          {/* Composición corporal */}
          {compositionItems.length > 0 && (
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <Text className="text-white font-semibold text-lg mb-4">
                Composición corporal
              </Text>
              <BodyCompositionColumns items={compositionItems} />
            </View>
          )}

          {/* Medidas perimetrales */}
          {perimeterRows.length > 0 && (
            <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-3">
              <Text className="text-white font-semibold text-lg mb-1 mt-2">
                Medidas perimetrales
              </Text>
              {perimeterRows.map((field, index) => (
                <PerimeterRow
                  key={field.key}
                  label={field.label}
                  value={measurement[field.key] as number}
                  isLast={index === perimeterRows.length - 1}
                />
              ))}
            </View>
          )}

          {onDelete != null && (
            <TouchableOpacity
              onPress={onDelete}
              disabled={isDeleting}
              activeOpacity={0.7}
              className="flex-row items-center justify-center gap-2 py-4 mt-2"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#f87171" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#f87171" />
                  <Text className="text-red-400 text-base font-semibold">
                    Eliminar registro
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
