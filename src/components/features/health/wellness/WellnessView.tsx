import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import {
  WellnessActivityItem,
  WellnessKind,
  WellnessTodaySummary,
} from "@/src/types/wellness";
import {
  formatMl,
  formatSleepDuration,
  getActivitySubtitle,
  getActivityTitle,
  MOOD_LABELS,
  SLEEP_QUALITY_LABELS,
} from "@/src/utils/wellness.utils";

import { WellnessGroupCard } from "./WellnessGroupCard";
import { WellnessLogRow } from "./WellnessLogRow";
import { WellnessRegisterCard } from "./WellnessRegisterCard";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Ícono de cada feature de bienestar (acento rose-400 lo aplica cada fila). */
const KIND_ICON: Record<WellnessKind, IoniconName> = {
  sleep: "moon",
  hydration: "water",
  mood: "happy",
  meditation: "flower",
};

const SIN_REGISTRO = "Sin registro";

interface WellnessViewProps {
  today: WellnessTodaySummary;
  recentActivity: WellnessActivityItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  // Abre el detalle de Sueño (`/health/sleep`): pantalla con registro + historial.
  onOpenSleep?: () => void;
  // Abre el detalle de Hidratación (`/health/hydration`): pantalla con registro + historial.
  onOpenHydration?: () => void;
  // Abre el detalle de Ánimo (`/health/mood`): pantalla con registro + historial.
  onOpenMood?: () => void;
  // Abre directamente el formulario de registro de Sueño (`/health/sleep-new`).
  onRegisterSleep?: () => void;
  // Acciones de "Registrar" de las features aún sin pantalla propia (fase futura).
  onRegisterHydration?: () => void;
  onRegisterMood?: () => void;
  onRegisterMeditation?: () => void;
  // Acción al tocar una entrada de "Actividad reciente" (detalle: fase futura).
  onOpenActivity?: (item: WellnessActivityItem) => void;
}

/**
 * Vista principal del módulo Bienestar (dark-only zinc, acento rose-400).
 * Orquesta el resumen "Hoy", el grid "Registrar" y la "Actividad reciente".
 */
export function WellnessView({
  today,
  recentActivity,
  isLoading,
  error,
  onRefresh,
  onOpenSleep,
  onOpenHydration,
  onOpenMood,
  onRegisterSleep,
  onRegisterHydration,
  onRegisterMood,
  onRegisterMeditation,
  onOpenActivity,
}: WellnessViewProps) {
  // ── Estado de carga ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#fb7185" />
        <Text className="text-zinc-400 mt-4">Cargando tu bienestar...</Text>
      </View>
    );
  }

  // ── Estado de error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={44} color="#fb7185" />
        <Text className="text-white text-xl font-bold mt-3">Algo falló</Text>
        <Text className="text-zinc-400 text-center mt-2">{error}</Text>
        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.85}
          className="bg-rose-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-zinc-900 font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Subtítulos del resumen "Hoy" ─────────────────────────────────────────────
  const sleepSubtitle = today.sleep
    ? `${formatSleepDuration(today.sleep.durationMinutes)} · ${
        SLEEP_QUALITY_LABELS[today.sleep.quality]
      }`
    : SIN_REGISTRO;
  const hydrationSubtitle =
    today.hydrationMl > 0 ? formatMl(today.hydrationMl) : SIN_REGISTRO;
  const moodSubtitle = today.mood ? MOOD_LABELS[today.mood.mood] : SIN_REGISTRO;

  return (
    <View className="pt-8 pb-32 px-4 gap-7">
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <View>
        <Text className="text-white text-4xl font-bold">Bienestar</Text>
        <Text className="text-zinc-400 text-base mt-2">
          Registra hábitos diarios que influyen en tu energía y recuperación.
        </Text>
      </View>

      {/* ── Hoy ─────────────────────────────────────────────────────────────── */}
      <WellnessGroupCard title="Hoy">
        <WellnessLogRow
          icon={KIND_ICON.sleep}
          title="Sueño"
          subtitle={sleepSubtitle}
          onPress={onOpenSleep}
        />
        <WellnessLogRow
          icon={KIND_ICON.hydration}
          title="Hidratación"
          subtitle={hydrationSubtitle}
          onPress={onOpenHydration}
        />
        <WellnessLogRow
          icon={KIND_ICON.mood}
          title="Ánimo"
          subtitle={moodSubtitle}
          onPress={onOpenMood}
        />
        {/* Meditación: oculta por ahora (fase futura). */}
      </WellnessGroupCard>

      {/* ── Registrar ───────────────────────────────────────────────────────── */}
      <View className="gap-3">
        <Text className="text-white text-2xl font-bold">Registrar</Text>
        <View className="flex-row gap-3">
          <WellnessRegisterCard
            icon={KIND_ICON.sleep}
            title="Sueño"
            subtitle="Duración y calidad"
            onPress={onRegisterSleep}
          />
          <WellnessRegisterCard
            icon={KIND_ICON.hydration}
            title="Hidratación"
            subtitle="Cantidad y bebida"
            onPress={onRegisterHydration}
          />
        </View>
        <View className="flex-row gap-3">
          <WellnessRegisterCard
            icon={KIND_ICON.mood}
            title="Ánimo"
            subtitle="Cómo te sientes"
            onPress={onRegisterMood}
          />
          {/* Meditación: oculta por ahora (fase futura). */}
        </View>
      </View>

      {/* ── Actividad reciente ──────────────────────────────────────────────── */}
      <View className="gap-3">
        <Text className="text-white text-2xl font-bold">Actividad reciente</Text>
        {recentActivity.length > 0 ? (
          <WellnessGroupCard>
            {recentActivity.map((item) => (
              <WellnessLogRow
                key={`${item.kind}-${item.id}`}
                icon={KIND_ICON[item.kind]}
                title={getActivityTitle(item.kind)}
                subtitle={getActivitySubtitle(item)}
                onPress={onOpenActivity ? () => onOpenActivity(item) : undefined}
              />
            ))}
          </WellnessGroupCard>
        ) : (
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 items-center">
            <Ionicons name="sparkles-outline" size={28} color="#71717a" />
            <Text className="text-zinc-400 text-center mt-3">
              Todavía no registraste hábitos. Empezá por uno de los de arriba.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
