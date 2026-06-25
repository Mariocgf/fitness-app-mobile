import React from "react";
import { Text, View } from "react-native";

import { IconTile } from "@/src/components/common/IconTile";
import { ClinicalReadingDto } from "@/src/types/clinical";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Formatea una fecha YYYY-MM-DD a "24 jun. 2026". */
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}. ${year}`;
};

/** Formatea la hora local (HH:MM) de un ISO 8601. */
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type ValueKey =
  | "glucoseMgDl"
  | "totalCholesterolMgDl"
  | "hdlMgDl"
  | "ldlMgDl"
  | "triglyceridesMgDl";

const VALUE_ROWS: { key: ValueKey; label: string }[] = [
  { key: "glucoseMgDl", label: "Glucosa" },
  { key: "totalCholesterolMgDl", label: "Colesterol total" },
  { key: "hdlMgDl", label: "HDL" },
  { key: "ldlMgDl", label: "LDL" },
  { key: "triglyceridesMgDl", label: "Triglicéridos" },
];

interface ClinicalReadingHistoryCardProps {
  reading: ClinicalReadingDto;
}

/**
 * Card del historial de lecturas clínicas. Muestra fecha + hora y solo los valores
 * con dato (no-null). Sin tap/chevron: el detalle no está implementado y la card ya
 * muestra todos los valores de la lectura.
 */
export function ClinicalReadingHistoryCard({
  reading,
}: ClinicalReadingHistoryCardProps) {
  const rows = VALUE_ROWS.filter((r) => reading[r.key] != null);

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
      {/* Encabezado: fecha + hora */}
      <View className="flex-row items-center gap-3 pb-4 border-b border-zinc-800">
        <IconTile name="calendar-outline" color="#fb7185" />
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {formatDate(reading.date)}
          </Text>
          <Text className="text-zinc-500 text-sm mt-0.5">
            {formatTime(reading.capturedAt)}
          </Text>
        </View>
      </View>

      {/* Filas de valores con dato */}
      <View className="pt-2">
        {rows.length === 0 ? (
          <Text className="text-zinc-500 text-sm py-2">
            Sin valores registrados.
          </Text>
        ) : (
          rows.map((r) => (
            <View
              key={r.key}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-zinc-300 text-base">{r.label}</Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-white font-bold text-base">
                  {reading[r.key]}
                </Text>
                <Text className="text-zinc-500 text-sm">mg/dL</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
