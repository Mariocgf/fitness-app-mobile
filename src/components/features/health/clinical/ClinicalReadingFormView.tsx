import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { ClinicalReadingPayload } from "@/src/types/clinical";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// ─── Tipos internos ────────────────────────────────────────────────────────

interface FieldState {
  glucoseMgDl: string;
  totalCholesterolMgDl: string;
  hdlMgDl: string;
  ldlMgDl: string;
  triglyceridesMgDl: string;
}

const EMPTY_FIELDS: FieldState = {
  glucoseMgDl: "",
  totalCholesterolMgDl: "",
  hdlMgDl: "",
  ldlMgDl: "",
  triglyceridesMgDl: "",
};

/** Orden y label de cada valor clínico tal como los muestra la maqueta. */
const VALUE_FIELDS: { key: keyof FieldState; label: string }[] = [
  { key: "glucoseMgDl", label: "Glucosa" },
  { key: "totalCholesterolMgDl", label: "Colesterol total" },
  { key: "hdlMgDl", label: "HDL" },
  { key: "ldlMgDl", label: "LDL" },
  { key: "triglyceridesMgDl", label: "Triglicéridos" },
];

// ─── Props ────────────────────────────────────────────────────────────────

interface ClinicalReadingFormViewProps {
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: (payload: ClinicalReadingPayload) => void;
}

// ─── Subcomponente: fila de valor ───────────────────────────────────────────

interface ReadingRowProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isLast?: boolean;
}

/** Fila "label ···· [input subrayado] mg/dL". Uso único: vive local. */
function ReadingRow({ label, value, onChangeText, isLast = false }: ReadingRowProps) {
  return (
    <View
      className={`flex-row items-center py-4 ${
        isLast ? "" : "border-b border-zinc-800"
      }`}
    >
      <Text className="flex-1 text-white text-base">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor="#52525b"
        className="w-16 text-right text-white text-lg font-bold border-b border-rose-400/70 pb-1"
      />
      <Text className="text-zinc-500 text-sm ml-3 w-12">mg/dL</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea una fecha a "24 jun. 2026". */
const formatDate = (d: Date): string =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}. ${d.getFullYear()}`;

/** Construye la clave YYYY-MM-DD a partir de los componentes locales (evita el shift de UTC). */
const toDateKey = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Parsea un string de input como número; acepta coma como separador decimal. */
const parseField = (raw: string): number | undefined => {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

/** Valida los valores cargados. Devuelve un mensaje de error o null si todo está bien. */
const validate = (fields: FieldState): string | null => {
  const filled = (Object.keys(fields) as (keyof FieldState)[]).filter(
    (k) => fields[k].trim() !== "",
  );

  if (filled.length === 0) {
    return "Cargá al menos un valor antes de guardar.";
  }

  for (const key of filled) {
    const n = parseField(fields[key]);
    const label = VALUE_FIELDS.find((f) => f.key === key)?.label ?? key;
    if (n == null || n <= 0) {
      return `"${label}" debe ser un número mayor a 0.`;
    }
  }

  return null;
};

/** Construye el payload con la fecha + solo los valores cargados. */
const buildPayload = (fields: FieldState, date: Date): ClinicalReadingPayload => {
  const payload: ClinicalReadingPayload = { date: toDateKey(date) };
  for (const key of Object.keys(fields) as (keyof FieldState)[]) {
    const n = parseField(fields[key]);
    if (n != null) payload[key] = n;
  }
  return payload;
};

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Formulario de "Registrar lectura" clínica (dark-only zinc, acento rose-400).
 * Fecha (default hoy) + 5 valores opcionales en mg/dL. Cada valor debe ser > 0
 * (se valida en cliente para evitar el 400 del backend). Se manda solo lo cargado.
 */
export function ClinicalReadingFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: ClinicalReadingFormViewProps) {
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const setField = (key: keyof FieldState) => (text: string) => {
    setFields((prev) => ({ ...prev, [key]: text }));
    if (validationError != null) setValidationError(null);
  };

  const handleSave = () => {
    const error = validate(fields);
    if (error != null) {
      setValidationError(error);
      return;
    }
    onSubmit(buildPayload(fields, date));
  };

  const displayError = validationError ?? submitError;
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Header: back circular + título grande + subtítulo */}
      <View className="px-4 pt-4">
        <TouchableOpacity
          onPress={onBack}
          disabled={isSubmitting}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mb-4"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-4xl font-bold">Registrar lectura</Text>
        <Text className="text-zinc-400 mt-1">
          Cargá solo los valores que tengas disponibles.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="px-4 pt-6 gap-4"
      >
        {/* Fecha */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-1">Fecha</Text>
          <TouchableOpacity
            onPress={() => setShowPicker((s) => !s)}
            className="flex-row items-center justify-between py-1"
          >
            <Text className="text-zinc-300 text-base">{formatDate(date)}</Text>
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={22} color={ROSE} />
              <Ionicons name="chevron-forward" size={18} color="#71717a" />
            </View>
          </TouchableOpacity>

          {showPicker &&
            (Platform.OS === "ios" ? (
              <View className="items-center">
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  textColor="#ffffff"
                  style={{ width: "100%" }}
                  onChange={(_e, d) => {
                    if (d) setDate(d);
                  }}
                />
              </View>
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_e, d) => {
                  setShowPicker(false);
                  if (d) setDate(d);
                }}
              />
            ))}
        </View>

        {/* Valores clínicos */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2">
          <Text className="text-white text-lg font-bold mt-3 mb-1">
            Valores clínicos
          </Text>
          {VALUE_FIELDS.map((f, i) => (
            <ReadingRow
              key={f.key}
              label={f.label}
              value={fields[f.key]}
              onChangeText={setField(f.key)}
              isLast={i === VALUE_FIELDS.length - 1}
            />
          ))}
        </View>

        {/* Nota informativa */}
        <View className="flex-row items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
          <Ionicons name="information-circle-outline" size={18} color={ROSE} />
          <Text className="flex-1 text-zinc-400 text-sm">
            Podés dejar campos vacíos si no tenés ese valor.
          </Text>
        </View>

        {/* Mensaje de error */}
        {displayError != null && (
          <View className="flex-row items-start gap-2 px-1">
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={ROSE}
              style={{ marginTop: 2 }}
            />
            <Text className="text-rose-400 text-sm flex-1">{displayError}</Text>
          </View>
        )}

        {/* CTA dentro del scroll. paddingBottom suma TAB_BAR_HEIGHT para no quedar tapado. */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSubmitting}
          className={`flex-row items-center justify-center gap-2 py-4 rounded-2xl ${
            isSubmitting ? "bg-rose-400/50" : "bg-rose-400"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#18181b" />
          ) : (
            <Text className="text-zinc-900 font-bold text-base">
              Guardar lectura
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
