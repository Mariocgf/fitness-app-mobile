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
  AiConsentPayload,
  BloodType,
  CLINICAL_PARAMS,
  ClinicalAllowKey,
  ClinicalHasKey,
  ClinicalProfileDto,
  ClinicalProfilePayload,
  RhFactor,
} from "@/src/types/clinical";
import { UserMedicalConditionDto } from "@/src/types/health";

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

type DeclaredState = Record<ClinicalHasKey, boolean>;
type ConsentState = Record<ClinicalAllowKey, boolean>;

const EMPTY_DECLARED: DeclaredState = {
  hasGlucose: false,
  hasTotalCholesterol: false,
  hasHdl: false,
  hasLdl: false,
  hasTriglycerides: false,
};

const EMPTY_CONSENT: ConsentState = {
  allowAiGlucose: false,
  allowAiTotalCholesterol: false,
  allowAiHdl: false,
  allowAiLdl: false,
  allowAiTriglycerides: false,
};

/** Arma el payload de PUT /ai-consent a partir del master y el estado por parámetro. */
function buildConsentPayload(
  master: boolean,
  consent: ConsentState,
): AiConsentPayload {
  const payload = { enabled: master } as AiConsentPayload;
  for (const param of CLINICAL_PARAMS) {
    payload[param.consentKey] = consent[param.allowKey];
  }
  return payload;
}

interface ClinicalDataViewProps {
  profile: ClinicalProfileDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  conditions: UserMedicalConditionDto[];
  conditionsLoading: boolean;
  onBack: () => void;
  onSave: (payload: ClinicalProfilePayload) => void;
  /** Persiste el consentimiento de IA al toque (PUT /ai-consent, aparte de "Guardar cambios"). */
  onSetAiConsent: (payload: AiConsentPayload) => void;
  /** Togglea el consentimiento de IA de una condición médica puntual. */
  onToggleConditionAi: (conditionId: string, enabled: boolean) => void;
}

// ─── Subcomponente: fila con toggle ──────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

/** Fila "label ········ [switch]". Uso único: vive local. */
function ToggleRow({
  label,
  value,
  onValueChange,
  isLast = false,
  disabled = false,
}: ToggleRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        isLast ? "" : "border-b border-zinc-800"
      }`}
    >
      <Text
        className={`flex-1 text-base pr-4 ${
          disabled ? "text-zinc-600" : "text-white"
        }`}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={SWITCH_TRACK}
        thumbColor="#ffffff"
        ios_backgroundColor={SWITCH_TRACK.false}
        style={disabled ? { opacity: 0.4 } : undefined}
      />
    </View>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Vista de "Datos clínicos" (perfil): grupo sanguíneo, Rh, parámetros declarados,
 * consentimiento de uso por IA (master + por parámetro) y condiciones médicas.
 * Dark-only zinc, acento rose-400.
 *
 * El estado local se hidrata una sola vez cuando llega el perfil. "Guardar cambios"
 * persiste grupo/Rh/declaraciones (PUT /profile); los toggles de IA persisten por
 * separado al cambiarlos (PUT /ai-consent y .../user-medical-conditions/ai-consent).
 *
 * Un parámetro llega a la IA solo si: master && consentimiento del parámetro &&
 * el parámetro está declarado. Por eso el toggle por parámetro se deshabilita si el
 * master está apagado o el parámetro no está declarado.
 */
export function ClinicalDataView({
  profile,
  isLoading,
  isSubmitting,
  submitError,
  conditions,
  conditionsLoading,
  onBack,
  onSave,
  onSetAiConsent,
  onToggleConditionAi,
}: ClinicalDataViewProps) {
  const insets = useSafeAreaInsets();

  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [rhFactor, setRhFactor] = useState<RhFactor | null>(null);
  const [declared, setDeclared] = useState<DeclaredState>(EMPTY_DECLARED);
  const [allowAiUsage, setAllowAiUsage] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(EMPTY_CONSENT);

  // Hidratar una sola vez cuando el perfil llega del backend (sin pisar ediciones).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (profile && !hydratedRef.current) {
      hydratedRef.current = true;
      setBloodType(profile.bloodType);
      setRhFactor(profile.rhFactor);
      setDeclared({
        hasGlucose: profile.hasGlucose,
        hasTotalCholesterol: profile.hasTotalCholesterol,
        hasHdl: profile.hasHdl,
        hasLdl: profile.hasLdl,
        hasTriglycerides: profile.hasTriglycerides,
      });
      setAllowAiUsage(profile.allowAiUsage);
      setConsent({
        allowAiGlucose: profile.allowAiGlucose,
        allowAiTotalCholesterol: profile.allowAiTotalCholesterol,
        allowAiHdl: profile.allowAiHdl,
        allowAiLdl: profile.allowAiLdl,
        allowAiTriglycerides: profile.allowAiTriglycerides,
      });
    }
  }, [profile]);

  const handleToggleDeclared = (key: ClinicalHasKey, value: boolean) => {
    setDeclared((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleMaster = (enabled: boolean) => {
    setAllowAiUsage(enabled); // optimista
    onSetAiConsent(buildConsentPayload(enabled, consent));
  };

  const handleToggleParamConsent = (key: ClinicalAllowKey, value: boolean) => {
    const next = { ...consent, [key]: value };
    setConsent(next); // optimista
    onSetAiConsent(buildConsentPayload(allowAiUsage, next));
  };

  const handleSave = () => {
    onSave({
      bloodType,
      rhFactor,
      hasGlucose: declared.hasGlucose,
      hasTotalCholesterol: declared.hasTotalCholesterol,
      hasHdl: declared.hasHdl,
      hasLdl: declared.hasLdl,
      hasTriglycerides: declared.hasTriglycerides,
    });
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

        {/* Parámetros declarados */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2">
          <Text className="text-white text-lg font-bold mt-3 mb-1">
            Parámetros que controlás
          </Text>
          <Text className="text-zinc-500 text-sm mb-1">
            Marcá los que llevás un seguimiento (glucemia, lípidos).
          </Text>
          {CLINICAL_PARAMS.map((param, i) => (
            <ToggleRow
              key={param.hasKey}
              label={param.label}
              value={declared[param.hasKey]}
              onValueChange={(v) => handleToggleDeclared(param.hasKey, v)}
              isLast={i === CLINICAL_PARAMS.length - 1}
            />
          ))}
        </View>

        {/* Uso por IA: master + por parámetro */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-5">
          <Text className="text-white text-lg font-bold mb-4">Uso por IA</Text>

          <View className="flex-row items-center gap-3 pb-4 border-b border-zinc-800">
            <View className="w-12 h-12 rounded-full border border-zinc-700 items-center justify-center">
              <Ionicons
                name={allowAiUsage ? "sparkles-outline" : "lock-closed-outline"}
                size={20}
                color={ROSE}
              />
            </View>
            <Text className="flex-1 text-zinc-400 text-sm leading-5">
              A la IA solo le llega el hecho declarado, nunca tus valores
              numéricos. Elegís por parámetro qué puede usar.
            </Text>
          </View>

          <ToggleRow
            label="Permitir que la IA use mis datos clínicos"
            value={allowAiUsage}
            onValueChange={handleToggleMaster}
          />

          {/* Consentimiento por parámetro: solo tiene sentido con el master encendido
              y el parámetro declarado. */}
          {CLINICAL_PARAMS.map((param, i) => {
            const isDeclared = declared[param.hasKey];
            const disabled = !allowAiUsage || !isDeclared;
            return (
              <ToggleRow
                key={param.allowKey}
                label={param.label}
                value={consent[param.allowKey]}
                onValueChange={(v) => handleToggleParamConsent(param.allowKey, v)}
                disabled={disabled}
                isLast={i === CLINICAL_PARAMS.length - 1}
              />
            );
          })}
          <Text className="text-zinc-500 text-sm pb-4 pt-1">
            Podés activar o desactivar esto cuando quieras.
          </Text>
        </View>

        {/* Condiciones médicas (toggle de IA por condición) */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-2">
          <Text className="text-white text-lg font-bold mt-3 mb-1">
            Condiciones médicas
          </Text>
          <Text className="text-zinc-500 text-sm mb-1">
            Elegí qué condiciones puede tener en cuenta la IA.
          </Text>

          {conditionsLoading && conditions.length === 0 ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={ROSE} />
            </View>
          ) : conditions.length === 0 ? (
            <Text className="text-zinc-500 text-sm py-4">
              No tenés condiciones médicas cargadas.
            </Text>
          ) : (
            conditions.map((condition, i) => (
              <ToggleRow
                key={condition.id}
                label={condition.name}
                value={condition.allowAiUsage}
                onValueChange={(v) => onToggleConditionAi(condition.id, v)}
                isLast={i === conditions.length - 1}
              />
            ))
          )}
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
