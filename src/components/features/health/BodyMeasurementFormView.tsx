import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
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

import { BodyMeasurementPayload } from "@/src/types/health";

cssInterop(Ionicons, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

// ─── Tipos internos ────────────────────────────────────────────────────────

interface FieldState {
  weightKg: string;
  waistCm: string;
  neckCm: string;
  hipCm: string;
  chestCm: string;
  armCm: string;
  forearmCm: string;
  thighCm: string;
  calfCm: string;
}

const EMPTY_FIELDS: FieldState = {
  weightKg: "",
  waistCm: "",
  neckCm: "",
  hipCm: "",
  chestCm: "",
  armCm: "",
  forearmCm: "",
  thighCm: "",
  calfCm: "",
};

/** Nombres legibles de cada campo para los mensajes de error */
const FIELD_LABELS: Record<keyof FieldState, string> = {
  weightKg: "Peso",
  waistCm: "Cintura",
  neckCm: "Cuello",
  hipCm: "Cadera",
  chestCm: "Pecho",
  armCm: "Brazo",
  forearmCm: "Antebrazo",
  thighCm: "Muslo",
  calfCm: "Pantorrilla",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BodyMeasurementFormViewProps {
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: (payload: BodyMeasurementPayload) => void;
}

// ─── Subcomponente: fila de input ────────────────────────────────────────────

interface MeasurementRowProps {
  label: string;
  value: string;
  unit: string;
  note?: string;
  onChangeText: (text: string) => void;
  isLast?: boolean;
}

function MeasurementRow({
  label,
  value,
  unit,
  note,
  onChangeText,
  isLast = false,
}: MeasurementRowProps) {
  return (
    <View
      className={`flex-row items-center py-3.5 ${
        isLast ? "" : "border-b border-slate-100 dark:border-slate-800"
      }`}
    >
      {/* Etiqueta */}
      <View className="flex-1">
        <Text className="text-slate-900 dark:text-slate-50 text-base font-medium">
          {label}
        </Text>
        {note != null && (
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            {note}
          </Text>
        )}
      </View>

      {/* Input + unidad */}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor="#94a3b8"
          className="w-20 text-right text-slate-900 dark:text-slate-50 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-base"
        />
        <Text className="text-slate-500 dark:text-slate-400 text-sm w-6">
          {unit}
        </Text>
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parsea un string de input como número; acepta coma como separador decimal. */
const parseField = (raw: string): number | undefined => {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

/** Valida los campos del formulario. Devuelve un mensaje de error o null si todo está bien. */
const validate = (fields: FieldState): string | null => {
  const filledEntries = (Object.keys(fields) as (keyof FieldState)[]).filter(
    (k) => fields[k].trim() !== "",
  );

  if (filledEntries.length === 0) {
    return "Ingresá al menos una medida antes de guardar.";
  }

  for (const key of filledEntries) {
    const n = parseField(fields[key]);
    if (n == null || n <= 0) {
      return `"${FIELD_LABELS[key]}" debe ser un número mayor a 0.`;
    }
  }

  return null;
};

/** Construye el payload a partir del estado de campos validado. */
const buildPayload = (fields: FieldState): BodyMeasurementPayload => {
  const payload: BodyMeasurementPayload = {};

  const w = parseField(fields.weightKg);
  if (w != null) payload.weightKg = w;

  const waist = parseField(fields.waistCm);
  if (waist != null) payload.waistCm = waist;

  const neck = parseField(fields.neckCm);
  if (neck != null) payload.neckCm = neck;

  const hip = parseField(fields.hipCm);
  if (hip != null) payload.hipCm = hip;

  const chest = parseField(fields.chestCm);
  if (chest != null) payload.chestCm = chest;

  const arm = parseField(fields.armCm);
  if (arm != null) payload.armCm = arm;

  const forearm = parseField(fields.forearmCm);
  if (forearm != null) payload.forearmCm = forearm;

  const thigh = parseField(fields.thighCm);
  if (thigh != null) payload.thighCm = thigh;

  const calf = parseField(fields.calfCm);
  if (calf != null) payload.calfCm = calf;

  return payload;
};

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Formulario de registro de medidas corporales.
 * El estado de los campos vive aquí; la lógica de submit viene del hook en la pantalla padre.
 */
export function BodyMeasurementFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: BodyMeasurementFormViewProps) {
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [validationError, setValidationError] = useState<string | null>(null);

  const setField = (key: keyof FieldState) => (text: string) => {
    setFields((prev) => ({ ...prev, [key]: text }));
    // Limpiar error de validación al empezar a escribir
    if (validationError != null) setValidationError(null);
  };

  const handleSave = () => {
    const error = validate(fields);
    if (error != null) {
      setValidationError(error);
      return;
    }
    onSubmit(buildPayload(fields));
  };

  const displayError = validationError ?? submitError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-6 pb-4 gap-4">
        <TouchableOpacity
          onPress={onBack}
          className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center"
          disabled={isSubmitting}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            className="text-slate-900 dark:text-slate-50"
          />
        </TouchableOpacity>
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-semibold flex-1">
          Registrar medidas
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-28 gap-4"
      >
        {/* Sección: Peso y composición */}
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <View className="flex-row items-center mb-3 gap-3">
            <View className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
              <Ionicons
                name="scale-outline"
                size={20}
                className="text-rose-600 dark:text-rose-400"
              />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">
                Peso
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                Composición corporal
              </Text>
            </View>
          </View>

          <MeasurementRow
            label="Peso"
            value={fields.weightKg}
            unit="kg"
            onChangeText={setField("weightKg")}
            isLast
          />
        </View>

        {/* Sección: Medidas perimetrales */}
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <View className="flex-row items-center mb-3 gap-3">
            <View className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
              <Ionicons
                name="resize-outline"
                size={20}
                className="text-rose-600 dark:text-rose-400"
              />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-slate-50 text-base font-bold">
                Medidas perimetrales
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                Cintura + cuello activan el cálculo de grasa
              </Text>
            </View>
          </View>

          <MeasurementRow
            label="Cintura"
            value={fields.waistCm}
            unit="cm"
            onChangeText={setField("waistCm")}
          />
          <MeasurementRow
            label="Cuello"
            value={fields.neckCm}
            unit="cm"
            onChangeText={setField("neckCm")}
          />
          <MeasurementRow
            label="Cadera"
            value={fields.hipCm}
            unit="cm"
            note="Necesaria para el cálculo en mujeres"
            onChangeText={setField("hipCm")}
          />
          <MeasurementRow
            label="Pecho"
            value={fields.chestCm}
            unit="cm"
            onChangeText={setField("chestCm")}
          />
          <MeasurementRow
            label="Brazo"
            value={fields.armCm}
            unit="cm"
            onChangeText={setField("armCm")}
          />
          <MeasurementRow
            label="Antebrazo"
            value={fields.forearmCm}
            unit="cm"
            onChangeText={setField("forearmCm")}
          />
          <MeasurementRow
            label="Muslo"
            value={fields.thighCm}
            unit="cm"
            onChangeText={setField("thighCm")}
          />
          <MeasurementRow
            label="Pantorrilla"
            value={fields.calfCm}
            unit="cm"
            onChangeText={setField("calfCm")}
            isLast
          />
        </View>

        {/* Mensaje de error */}
        {displayError != null && (
          <View className="flex-row items-start gap-2 px-1">
            <Ionicons
              name="alert-circle-outline"
              size={16}
              className="text-rose-600 dark:text-rose-400 mt-0.5"
            />
            <Text className="text-rose-600 dark:text-rose-400 text-sm flex-1">
              {displayError}
            </Text>
          </View>
        )}

        {/* Botón guardar */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isSubmitting}
          className={`py-4 rounded-xl items-center ${
            isSubmitting
              ? "bg-rose-600/50 dark:bg-rose-400/50"
              : "bg-rose-600 dark:bg-rose-400"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white dark:text-slate-900 font-bold text-base">
              Guardar medición
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
