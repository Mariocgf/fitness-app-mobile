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

import DatePickerField from "@/src/components/common/DatePickerField";
import DurationWheelPicker from "@/src/components/common/DurationWheelPicker";
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/components/common/SegmentedControl";
import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { AddSleepLogDto, SleepQuality } from "@/src/types/wellness";
import {
  formatFullDate,
  SLEEP_QUALITY_LABELS,
  toDateKey,
} from "@/src/utils/wellness.utils";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

/** Límite del backend para la duración: 1 a 720 min (12 h). */
const MAX_DURATION_MINUTES = 720;

/**
 * Máximo de caracteres de la nota. La maqueta muestra "34/120"; el backend acepta
 * hasta 500, pero respetamos el límite de la maqueta (queda holgado dentro del
 * tope del contrato). Ver `agent-implementation-lessons.md`.
 */
const NOTE_MAX_LENGTH = 120;

/** Opciones de calidad en el orden de la maqueta (Muy mala → Excelente). */
const QUALITY_OPTIONS: SegmentedOption<SleepQuality>[] = (
  ["VeryPoor", "Poor", "Fair", "Good", "Excellent"] as SleepQuality[]
).map((q) => ({ label: SLEEP_QUALITY_LABELS[q], value: q }));

interface SleepFormViewProps {
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: (payload: AddSleepLogDto) => void;
}

/**
 * Formulario de "Registrar sueño" (dark-only zinc, acento rose-400). Fecha
 * (default hoy), Duración (wheel h+min, default 8 h), Calidad (segmentado) y Nota
 * opcional. Valida en cliente la duración (1–720 min) para evitar el 400 del backend.
 * Mismo molde que `ClinicalReadingFormView` del módulo clínico.
 */
export function SleepFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: SleepFormViewProps) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(0);
  const [quality, setQuality] = useState<SleepQuality>("Good");
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalMinutes = hours * 60 + minutes;

  const handleDurationChange = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
    if (validationError != null) setValidationError(null);
  };

  const handleSave = () => {
    if (totalMinutes < 1) {
      setValidationError("La duración debe ser mayor a 0.");
      return;
    }
    if (totalMinutes > MAX_DURATION_MINUTES) {
      setValidationError("La duración máxima es de 12 h.");
      return;
    }
    const trimmedNote = note.trim();
    onSubmit({
      date: toDateKey(date),
      durationMinutes: totalMinutes,
      quality,
      note: trimmedNote === "" ? null : trimmedNote,
    });
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
        <Text className="text-white text-4xl font-bold">Registrar sueño</Text>
        <Text className="text-zinc-400 mt-1">
          Carga la duración y calidad de tu descanso.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="px-4 pt-6 gap-4"
      >
        {/* Fecha */}
        <DatePickerField
          value={date}
          onChange={setDate}
          formatValue={(d) => formatFullDate(toDateKey(d))}
          accentColor={ROSE}
        />

        {/* Duración */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-1">Duración</Text>
          <DurationWheelPicker
            hours={hours}
            minutes={minutes}
            onChange={handleDurationChange}
            maxHours={12}
            minuteStep={15}
            accent="rose"
          />
          <View className="flex-row items-center justify-center gap-2 mt-1">
            <Ionicons name="moon" size={18} color={ROSE} />
            <Text className="text-rose-400 text-lg font-semibold">
              {totalMinutes} min
            </Text>
          </View>
        </View>

        {/* Calidad del sueño */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-3">
            Calidad del sueño
          </Text>
          <SegmentedControl
            options={QUALITY_OPTIONS}
            value={quality}
            onChange={setQuality}
            accent="rose"
            variant="solid"
          />
        </View>

        {/* Nota */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-3">Nota</Text>
          <View className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Dormí bien, sin interrupciones."
              placeholderTextColor="#52525b"
              multiline
              maxLength={NOTE_MAX_LENGTH}
              className="text-white text-base min-h-[64px]"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-zinc-500 text-xs text-right mt-1">
              {note.length}/{NOTE_MAX_LENGTH}
            </Text>
          </View>
        </View>

        {/* Nota informativa */}
        <View className="flex-row items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={ROSE}
          />
          <Text className="flex-1 text-zinc-400 text-sm">
            La nota es opcional y puedes dejarla vacía.
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
              Guardar sueño
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
