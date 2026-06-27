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

import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/components/common/SegmentedControl";
import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import { AddHydrationLogDto, BeverageType } from "@/src/types/wellness";
import { BEVERAGE_LABELS, formatFullDate, toDateKey } from "@/src/utils/wellness.utils";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";

/** Límites del backend para la cantidad: 1 a 10000 ml. */
const MIN_AMOUNT_ML = 1;
const MAX_AMOUNT_ML = 10000;

/** Cantidades rápidas de la maqueta (ml). */
const AMOUNT_PRESETS = [250, 500, 750, 1000] as const;

/** Opciones de cantidad para el control segmentado ("250 ml", etc.). */
const AMOUNT_OPTIONS: SegmentedOption<string>[] = AMOUNT_PRESETS.map((ml) => ({
  label: `${ml} ml`,
  value: String(ml),
}));

/** Ícono de cada tipo de bebida (orden de la maqueta). */
const BEVERAGE_ICONS: Record<BeverageType, IoniconName> = {
  Water: "water-outline",
  Tea: "leaf-outline",
  Coffee: "cafe-outline",
  Infusion: "flask-outline",
  Other: "ellipsis-horizontal-circle-outline",
};

/** Tipos de bebida en el orden de la maqueta (Agua → Otro). */
const BEVERAGE_OPTIONS: BeverageType[] = [
  "Water",
  "Tea",
  "Coffee",
  "Infusion",
  "Other",
];

interface HydrationFormViewProps {
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: (payload: AddHydrationLogDto) => void;
}

/**
 * Formulario de "Registrar hidratación" (dark-only zinc, acento rose-400). Fecha
 * (default hoy), Cantidad (presets 250/500/750/1000 + personalizada) y Tipo de
 * bebida (lista con radio). Valida en cliente la cantidad (1–10000 ml) para evitar
 * el 400 del backend. Mismo molde que `SleepFormView`.
 */
export function HydrationFormView({
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: HydrationFormViewProps) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [amountMl, setAmountMl] = useState(500);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [beverageType, setBeverageType] = useState<BeverageType>("Water");
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearError = () => {
    if (validationError != null) setValidationError(null);
  };

  /** Selecciona una cantidad preset; cierra el input personalizado. */
  const handlePreset = (value: string) => {
    setAmountMl(parseInt(value, 10));
    setShowCustom(false);
    setCustomText("");
    clearError();
  };

  /** Actualiza la cantidad desde el input personalizado (solo dígitos). */
  const handleCustomChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    setCustomText(digits);
    if (digits !== "") setAmountMl(parseInt(digits, 10));
    clearError();
  };

  const handleSave = () => {
    if (!Number.isFinite(amountMl) || amountMl < MIN_AMOUNT_ML) {
      setValidationError("Ingresa una cantidad mayor a 0.");
      return;
    }
    if (amountMl > MAX_AMOUNT_ML) {
      setValidationError("La cantidad máxima es de 10000 ml.");
      return;
    }
    onSubmit({
      date: toDateKey(date),
      amountMl,
      beverageType,
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
        <Text className="text-white text-4xl font-bold">
          Registrar hidratación
        </Text>
        <Text className="text-zinc-400 mt-1">
          Carga la cantidad y el tipo de bebida.
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
            <Text className="text-zinc-300 text-base">
              {formatFullDate(toDateKey(date))}
            </Text>
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

        {/* Cantidad */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
          <Text className="text-white text-lg font-bold mb-1">Cantidad</Text>

          {/* Valor grande */}
          <View className="flex-row items-end justify-center py-2">
            <Text className="text-rose-400 text-6xl font-bold">{amountMl}</Text>
            <Text className="text-rose-400/70 text-2xl font-semibold mb-2 ml-1">
              ml
            </Text>
          </View>

          <SegmentedControl
            options={AMOUNT_OPTIONS}
            value={String(amountMl)}
            onChange={handlePreset}
            accent="rose"
            variant="solid"
          />

          {/* Separador */}
          <View className="h-px bg-zinc-800 my-4" />

          {/* Cantidad personalizada */}
          <TouchableOpacity
            onPress={() => setShowCustom((s) => !s)}
            className="flex-row items-center gap-3"
          >
            <Ionicons name="create-outline" size={22} color={ROSE} />
            <Text className="flex-1 text-zinc-200 text-base">
              Cantidad personalizada
            </Text>
            <Ionicons
              name={showCustom ? "chevron-down" : "chevron-forward"}
              size={18}
              color="#71717a"
            />
          </TouchableOpacity>

          {showCustom && (
            <View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 mt-3">
              <TextInput
                value={customText}
                onChangeText={handleCustomChange}
                placeholder="Ej. 600"
                placeholderTextColor="#52525b"
                keyboardType="number-pad"
                maxLength={5}
                className="flex-1 text-white text-base"
              />
              <Text className="text-zinc-500 text-base">ml</Text>
            </View>
          )}
        </View>

        {/* Tipo de bebida */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2">
          <Text className="text-white text-lg font-bold px-0 pt-3 pb-1">
            Tipo de bebida
          </Text>

          {BEVERAGE_OPTIONS.map((type, index) => {
            const isActive = type === beverageType;
            return (
              <View key={type}>
                {index > 0 ? <View className="h-px bg-zinc-800" /> : null}
                <TouchableOpacity
                  onPress={() => setBeverageType(type)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-4 py-4"
                >
                  <Ionicons
                    name={BEVERAGE_ICONS[type]}
                    size={24}
                    color={isActive ? ROSE : "#a1a1aa"}
                  />
                  <Text
                    className={`flex-1 text-base ${
                      isActive ? "text-white font-semibold" : "text-zinc-200"
                    }`}
                  >
                    {BEVERAGE_LABELS[type]}
                  </Text>
                  <Ionicons
                    name={isActive ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={isActive ? ROSE : "#52525b"}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Nota informativa */}
        <View className="flex-row items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
          <Ionicons name="information-circle-outline" size={18} color={ROSE} />
          <Text className="flex-1 text-zinc-400 text-sm">
            Puedes registrar varias tomas durante el día.
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
              Guardar hidratación
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
