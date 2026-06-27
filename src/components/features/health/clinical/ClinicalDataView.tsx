import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SegmentedControl } from "@/src/components/common/SegmentedControl";
import { TAB_BAR_HEIGHT } from "@/src/components/features/routine/routine-detail-shared";
import {
  BloodType,
  ClinicalProfileDto,
  ClinicalProfilePayload,
  RhFactor,
} from "@/src/types/clinical";

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = "#fb7185";
/** Track del Switch: zinc-700 apagado, rose-400 encendido. */
const SWITCH_TRACK = { false: "#3f3f46", true: ROSE };

// El SegmentedControl es genérico sobre string; los valores coinciden con
// los del enum que serializa el backend ("A", "Positive", …).
const BLOOD_TYPE_SEGMENTS = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "AB", value: "AB" },
  { label: "O", value: "O" },
];

const RH_SEGMENTS = [
  { label: "+", value: "Positive" },
  { label: "−", value: "Negative" },
];

interface ClinicalDataViewProps {
  profile: ClinicalProfileDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSave: (payload: ClinicalProfilePayload) => void;
  /** Persiste el consentimiento de IA al toque (PUT /ai-consent, aparte de "Guardar cambios"). */
  onToggleAiConsent: (enabled: boolean) => void;
}

// ─── Subcomponente: fila con toggle ──────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

/** Fila "label ········ [switch]". Uso único: vive local. */
function ToggleRow({ label, value, onValueChange, isLast = false }: ToggleRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        isLast ? "" : "border-b border-zinc-800"
      }`}
    >
      <Text className="flex-1 text-white text-base pr-4">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={SWITCH_TRACK}
        thumbColor="#ffffff"
        ios_backgroundColor={SWITCH_TRACK.false}
      />
    </View>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Vista de "Datos clínicos" (perfil): grupo sanguíneo, Rh, condiciones a considerar
 * y consentimiento de uso por IA. Dark-only zinc, acento rose-400.
 *
 * El estado local se hidrata una sola vez cuando llega el perfil. "Guardar cambios"
 * persiste grupo/Rh/flags (PUT /profile); el toggle de IA persiste por separado al
 * cambiarlo (PUT /ai-consent), que es lo que el contrato exige.
 */
export function ClinicalDataView({
  profile,
  isLoading,
  isSubmitting,
  submitError,
  onBack,
  onSave,
  onToggleAiConsent,
}: ClinicalDataViewProps) {
  const insets = useSafeAreaInsets();

  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [rhFactor, setRhFactor] = useState<RhFactor | null>(null);
  const [hasGlucose, setHasGlucose] = useState(false);
  const [hasDyslipidemia, setHasDyslipidemia] = useState(false);
  const [allowAiUsage, setAllowAiUsage] = useState(false);

  // Hidratar una sola vez cuando el perfil llega del backend (sin pisar ediciones).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (profile && !hydratedRef.current) {
      hydratedRef.current = true;
      setBloodType(profile.bloodType);
      setRhFactor(profile.rhFactor);
      setHasGlucose(profile.hasGlucose);
      setHasDyslipidemia(profile.hasDyslipidemia);
      setAllowAiUsage(profile.allowAiUsage);
    }
  }, [profile]);

  const handleToggleAi = (enabled: boolean) => {
    setAllowAiUsage(enabled); // optimista: el switch responde al toque
    onToggleAiConsent(enabled);
  };

  const handleSave = () => {
    onSave({ bloodType, rhFactor, hasGlucose, hasDyslipidemia });
  };

  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;

  // ── Estado de carga ────────────────────────────────────────────────────────
  if (isLoading && profile === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={ROSE} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header: back circular + título grande + subtítulo */}
      <View className="px-4 pt-4">
        <TouchableOpacity
          onPress={onBack}
          disabled={isSubmitting}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mb-4"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-4xl font-bold">Datos clínicos</Text>
        <Text className="text-zinc-400 mt-1">
          Información médica básica para personalizar tu experiencia.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="px-4 pt-6 gap-4"
      >
        {/* Perfil clínico: grupo sanguíneo + Rh */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-5">
          <Text className="text-white text-lg font-bold mb-4">Perfil clínico</Text>

          <Text className="text-zinc-400 text-sm mb-2">Grupo sanguíneo</Text>
          <SegmentedControl
            options={BLOOD_TYPE_SEGMENTS}
            value={bloodType ?? ""}
            onChange={(v) => setBloodType(v as BloodType)}
            accent="rose"
          />

          <View className="h-px bg-zinc-800 my-5" />

          <Text className="text-zinc-400 text-sm mb-2">Rh</Text>
          <SegmentedControl
            options={RH_SEGMENTS}
            value={rhFactor ?? ""}
            onChange={(v) => setRhFactor(v as RhFactor)}
            accent="rose"
          />
        </View>

        {/* Condiciones a considerar */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2">
          <Text className="text-white text-lg font-bold mt-3 mb-1">
            Condiciones a considerar
          </Text>
          <ToggleRow
            label="Monitoreo glucosa"
            value={hasGlucose}
            onValueChange={setHasGlucose}
          />
          <ToggleRow
            label="Lípidos / colesterol alto"
            value={hasDyslipidemia}
            onValueChange={setHasDyslipidemia}
            isLast
          />
        </View>

        {/* Uso por IA */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-5">
          <Text className="text-white text-lg font-bold mb-4">Uso por IA</Text>

          <View className="flex-row items-center gap-3 pb-4 border-b border-zinc-800">
            <View className="w-12 h-12 rounded-full border border-zinc-700 items-center justify-center">
              <Ionicons name="lock-closed-outline" size={20} color={ROSE} />
            </View>
            <Text className="flex-1 text-zinc-400 text-sm leading-5">
              {allowAiUsage
                ? "Tus datos clínicos se usan para personalizar tu experiencia con IA."
                : "No se están usando tus datos clínicos para personalizar con IA."}
            </Text>
          </View>

          <ToggleRow
            label="Permitir que la IA use mis datos clínicos"
            value={allowAiUsage}
            onValueChange={handleToggleAi}
            isLast
          />
          <Text className="text-zinc-500 text-sm pb-4 -mt-1">
            Podrás activar o desactivar esto cuando quieras.
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
              Guardar cambios
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
