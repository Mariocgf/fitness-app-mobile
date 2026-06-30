import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import {
  BLOOD_TYPE_LABELS,
  CLINICAL_PARAMS,
  ClinicalProfileDto,
  RH_LABELS,
} from "@/src/types/clinical";

interface ClinicalProfileCardProps {
  profile: ClinicalProfileDto | null;
  isLoading?: boolean;
  onPress: () => void;
}

/**
 * Card del dashboard de Salud que muestra y da acceso al perfil clínico.
 * Estado vacío (sin datos) → CTA para configurar; con datos → resumen tappable.
 */
export function ClinicalProfileCard({
  profile,
  isLoading = false,
  onPress,
}: ClinicalProfileCardProps) {
  // ── Estado de carga ──────────────────────────────────────────────────────
  if (isLoading && profile === null) {
    return (
      <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 h-28 items-center justify-center">
        <ActivityIndicator size="small" color="#fb7185" />
      </View>
    );
  }

  const bloodLabel =
    profile?.bloodType != null
      ? `${BLOOD_TYPE_LABELS[profile.bloodType]}${
          profile.rhFactor != null ? RH_LABELS[profile.rhFactor] : ""
        }`
      : null;

  // Parámetros declarados, en el orden canónico de CLINICAL_PARAMS.
  const conditions: string[] = profile
    ? CLINICAL_PARAMS.filter((p) => profile[p.hasKey]).map((p) => p.label)
    : [];

  const isEmpty = bloodLabel === null && conditions.length === 0;

  // ── Estado vacío ───────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <View className="flex-row items-start mb-4">
          <View className="flex-1 pr-4">
            <Text className="text-white text-2xl font-bold mb-2">
              Perfil clínico
            </Text>
            <Text className="text-zinc-400 leading-5">
              Cargá tu grupo sanguíneo y condiciones para personalizar tu
              experiencia.
            </Text>
          </View>
          <Ionicons name="medical-outline" size={36} color="#ffffff" />
        </View>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          className="py-4 rounded-2xl items-center bg-rose-400"
        >
          <Text className="text-zinc-900 font-bold text-base">
            Configurar perfil clínico
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Con datos ──────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
    >
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Ionicons name="medical-outline" size={26} color="#fb7185" />
          <Text className="text-white text-2xl font-bold">Perfil clínico</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#71717a" />
      </View>

      <View className="gap-3">
        {/* Grupo sanguíneo */}
        <View className="flex-row items-center justify-between">
          <Text className="text-zinc-400 text-sm">Grupo sanguíneo</Text>
          <Text className="text-white text-base font-semibold">
            {bloodLabel ?? "Sin definir"}
          </Text>
        </View>

        {/* Condiciones a considerar */}
        <View className="flex-row items-center justify-between">
          <Text className="text-zinc-400 text-sm">Condiciones</Text>
          <Text className="text-white text-base font-semibold">
            {conditions.length > 0 ? conditions.join(" · ") : "Ninguna"}
          </Text>
        </View>

        {/* Estado del consentimiento de IA */}
        <View className="flex-row items-center gap-2 pt-1">
          <Ionicons
            name={profile?.allowAiUsage ? "sparkles-outline" : "lock-closed-outline"}
            size={16}
            color="#a1a1aa"
          />
          <Text className="text-zinc-400 text-sm">
            IA: {profile?.allowAiUsage ? "activada" : "desactivada"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
