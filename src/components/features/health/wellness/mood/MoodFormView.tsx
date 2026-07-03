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
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/components/common/SegmentedControl";
import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { AddMoodLogDto, MoodLevel } from "@/src/types/wellness";
import {
  formatFullDate,
  MOOD_LABELS,
  MOOD_LEVELS_ORDERED,
  toDateKey,
} from "@/src/utils/wellness.utils";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

/**
 * Máximo de caracteres de la nota. El backend acepta hasta 500; usamos 120 para
 * mantener consistencia con `SleepFormView` (queda holgado dentro del contrato).
 */
const NOTE_MAX_LENGTH = 120;

/** Opciones de ánimo en el orden de la maqueta (Muy mal → Muy bien). */
const MOOD_OPTIONS: SegmentedOption<MoodLevel>[] = MOOD_LEVELS_ORDERED.map(
  (m) => ({ label: MOOD_LABELS[m], value: m }),
);

interface MoodFormViewProps {
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: (payload: AddMoodLogDto) => void;
}

/**
 * Formulario de "Registrar ánimo" (dark-only zinc, acento rose-400). Fecha
 * (default hoy), Estado de ánimo (segmentado, default "Bien") y Nota opcional.
 * Mismo molde que `SleepFormView` sin el campo de duración.
 */
export function MoodFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: MoodFormViewProps) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date());
  const [mood, setMood] = useState<MoodLevel>("Good");
  const [note, setNote] = useState("");

  const handleSave = () => {
    const trimmedNote = note.trim();
    onSubmit({
      date: toDateKey(date),
      mood,
      note: trimmedNote === "" ? null : trimmedNote,
    });
  };

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
        <Text className="text-white text-4xl font-bold">Registrar ánimo</Text>
        <Text className="text-zinc-400 mt-1">
          Elegí cómo te sentís y agregá una nota si querés.
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

        {/* Estado de ánimo */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-3">
            ¿Cómo te sentís?
          </Text>
          <SegmentedControl
            options={MOOD_OPTIONS}
            value={mood}
            onChange={setMood}
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
              placeholder="Día productivo, me siento bien."
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
        {submitError != null && (
          <View className="flex-row items-start gap-2 px-1">
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={ROSE}
              style={{ marginTop: 2 }}
            />
            <Text className="text-rose-400 text-sm flex-1">{submitError}</Text>
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
              Guardar ánimo
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
