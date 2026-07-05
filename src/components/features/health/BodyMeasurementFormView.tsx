import { Ionicons } from "@expo/vector-icons";
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
import { BodyMeasurementPayload } from "@/src/types/health";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

// ─── Tipos internos ────────────────────────────────────────────────────────

interface FieldState {
  weightKg: string;
  waistCm: string;
  neckCm: string;
  chestCm: string;
  armCm: string;
  forearmCm: string;
  hipCm: string;
  thighCm: string;
  calfCm: string;
}

const EMPTY_FIELDS: FieldState = {
  weightKg: "",
  waistCm: "",
  neckCm: "",
  chestCm: "",
  armCm: "",
  forearmCm: "",
  hipCm: "",
  thighCm: "",
  calfCm: "",
};

/** Nombres legibles de cada campo para los mensajes de error */
const FIELD_LABELS: Record<keyof FieldState, string> = {
  weightKg: "Peso",
  waistCm: "Cintura",
  neckCm: "Cuello",
  chestCm: "Pecho",
  armCm: "Brazo",
  forearmCm: "Antebrazo",
  hipCm: "Cadera",
  thighCm: "Muslo",
  calfCm: "Pantorrilla",
};

/** Orden y unidad de las medidas perimetrales tal como las muestra la maqueta. */
const PERIMETER_FIELDS: { key: keyof FieldState; label: string }[] = [
  { key: "waistCm", label: "Cintura" },
  { key: "neckCm", label: "Cuello" },
  { key: "chestCm", label: "Pecho" },
  { key: "armCm", label: "Brazo" },
  { key: "forearmCm", label: "Antebrazo" },
  { key: "hipCm", label: "Cadera" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Pantorrilla" },
];

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
  onChangeText: (text: string) => void;
  isLast?: boolean;
}

/** Fila "label ········ [input unidad]" del formulario. Uso único: vive local. */
function MeasurementRow({
  label,
  value,
  unit,
  onChangeText,
  isLast = false,
}: MeasurementRowProps) {
  return (
    <View
      className={`flex-row items-center py-3.5 ${
        isLast ? "" : "border-b border-zinc-800"
      }`}
    >
      <Text className="flex-1 text-white text-base font-medium">{label}</Text>

      <View className="flex-row items-center border border-zinc-800 rounded-xl px-4 py-2.5 w-32">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor="#52525b"
          className="flex-1 min-w-0 text-right text-white text-base font-bold"
        />
        <Text className="text-zinc-500 text-sm ml-2">{unit}</Text>
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
  for (const key of Object.keys(fields) as (keyof FieldState)[]) {
    const n = parseField(fields[key]);
    if (n != null) payload[key] = n;
  }
  return payload;
};

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Formulario de registro de medidas corporales (dark-only zinc, acento rose-400).
 * El estado de los campos vive aquí; la lógica de submit viene del hook en la pantalla padre.
 *
 * Nota: la maqueta incluía un panel "Grasa corporal estimada / Masa magra", pero esos
 * valores los calcula el backend (fórmula Marina EE.UU.) recién al guardar — el frontend
 * no los tiene en vivo y agent.md §7 prohíbe calcular salud en el cliente. Por eso no se
 * renderiza acá; el usuario los ve en el dashboard después de guardar.
 */
export function BodyMeasurementFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: BodyMeasurementFormViewProps) {
  const insets = useSafeAreaInsets();
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
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Header: back + título centrado */}
      <View className="flex-row items-center px-4 pt-6 pb-4">
        <TouchableOpacity
          onPress={onBack}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center"
          disabled={isSubmitting}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-xl font-bold">
          Registrar medición
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="px-4 pt-2 gap-4"
      >
        {/* Card única: composición corporal + medidas perimetrales */}
        <View className="bg-zinc-900 rounded-3xl px-5 py-5">
          {/* Composición corporal */}
          <Text className="text-white text-lg font-bold mb-1">
            Composición corporal
          </Text>
          <MeasurementRow
            label="Peso"
            value={fields.weightKg}
            unit="kg"
            onChangeText={setField("weightKg")}
            isLast
          />

          <View className="h-px bg-zinc-800 my-4" />

          {/* Medidas perimetrales */}
          <Text className="text-white text-lg font-bold mb-1">
            Medidas perimetrales
          </Text>
          <Text className="text-zinc-500 text-sm mb-2">
            Estas medidas permiten estimar composición corporal y evolución
            física.
          </Text>

          {PERIMETER_FIELDS.map((f, i) => (
            <MeasurementRow
              key={f.key}
              label={f.label}
              value={fields[f.key]}
              unit="cm"
              onChangeText={setField(f.key)}
              isLast={i === PERIMETER_FIELDS.length - 1}
            />
          ))}
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

        {/* CTA dentro del scroll. El paddingBottom suma TAB_BAR_HEIGHT para no quedar tapado. */}
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
            <>
              <Ionicons name="save-outline" size={20} color="#18181b" />
              <Text className="text-zinc-900 font-bold text-base">
                Guardar medición
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
