import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { BodyMeasurementDto } from "@/src/types/health";

import { BodyCompositionColumns } from "./BodyCompositionColumns";

cssInterop(Ionicons, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

interface LastMeasurementCardProps {
  measurement: BodyMeasurementDto | null;
  onRegister: () => void;
  onViewDetail?: () => void;
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Formatea una fecha YYYY-MM-DD a "16 jun 2026". */
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

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
      <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <View className="flex-row items-start mb-4">
          <View className="flex-1 pr-4">
            <Text className="text-white text-2xl font-bold mb-2">
              Medidas corporales
            </Text>
            <Text className="text-zinc-400 leading-5">
              Todavía no tenés mediciones.{"\n"}Registrá tus primeras medidas
              para seguir tu progreso.
            </Text>
          </View>
          <Ionicons name="body-outline" size={40} color="#ffffff" />
        </View>
        <TouchableOpacity
          onPress={onRegister}
          activeOpacity={0.85}
          className="py-4 rounded-2xl items-center bg-rose-400"
        >
          <Text className="text-zinc-900 font-bold text-base">
            Registrar primera medición
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Con medición ─────────────────────────────────────────────────────────
  // Solo se muestran las columnas de composición con dato real.
  const compositionItems = [
    measurement.weightKg != null && {
      label: "Peso",
      value: measurement.weightKg.toString(),
      unit: "kg",
    },
    measurement.bodyFatPercentage != null && {
      label: "Grasa",
      value: measurement.bodyFatPercentage.toFixed(1),
      unit: "%",
    },
    measurement.leanMassKg != null && {
      label: "Masa magra",
      value: measurement.leanMassKg.toFixed(1),
      unit: "kg",
    },
  ].filter(Boolean) as { label: string; value: string; unit: string }[];

  // Cantidad de medidas perimetrales registradas.
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
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      {/* Área de información — tappable para ver detalle */}
      <TouchableOpacity
        onPress={onViewDetail}
        activeOpacity={onViewDetail ? 0.75 : 1}
        disabled={!onViewDetail}
        className="p-5 pb-4"
      >
        {/* Título + fecha debajo + flecha */}
        <View className="flex-row items-start justify-between mb-5">
          <View>
            <Text className="text-white text-2xl font-bold">
              Última medición
            </Text>
            <Text className="text-zinc-400 text-sm mt-0.5">
              {formatDate(measurement.date)}
            </Text>
          </View>
          {onViewDetail && (
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          )}
        </View>

        {/* Columnas de composición corporal separadas por divisores */}
        <BodyCompositionColumns items={compositionItems} className="mb-5" />

        {/* Resumen de medidas perimetrales */}
        {perimeterCount > 0 && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="body-outline" size={18} color="#a1a1aa" />
            <Text className="text-zinc-400 text-sm">
              {perimeterCount} medida{perimeterCount !== 1 ? "s" : ""} perimetral
              {perimeterCount !== 1 ? "es" : ""} registrada
              {perimeterCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* CTA — separado del área tappable */}
      <View className="px-5 pb-5 pt-1">
        <TouchableOpacity
          onPress={onRegister}
          activeOpacity={0.85}
          className="py-4 rounded-2xl items-center justify-center flex-row gap-2 bg-rose-400"
        >
          <Ionicons name="add-circle-outline" size={22} color="#18181b" />
          <Text className="text-zinc-900 font-bold text-base">
            Registrar nueva medición
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
