import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { SelectablePill } from '@/src/components/common/SelectablePill';
import { AddSleepLogDto, SleepQuality } from '@/src/types/wellness';
import { getTodayDateKey } from '@/src/utils/nutrition.utils';
import { SLEEP_QUALITY_LABELS } from '@/src/utils/wellness.utils';

/** Acento del módulo Salud (colors.md → rose-400). */
const ROSE = '#fb7185';

/** Calidades en orden peor → mejor (igual que el form completo). */
const QUALITY_ORDER: SleepQuality[] = [
  'VeryPoor',
  'Poor',
  'Fair',
  'Good',
  'Excellent',
];

interface SleepQuickCardProps {
  /** Registra el sueño de hoy. */
  onSubmit: (payload: AddSleepLogDto) => void;
  /** Deshabilita los controles mientras se persiste. */
  isSubmitting: boolean;
}

/**
 * Registro rápido de sueño del Home (dark-only zinc, acento rose-400). Colapsada
 * muestra un acceso; expandida ofrece duración (stepper de horas) + calidad
 * (pills). No usa `WheelPicker` a propósito: el wheel pelea con el scroll del
 * home (ver agent-implementation-lessons.md). El form completo (con nota y
 * minutos finos) vive en el módulo Salud. Al guardar, el padre la oculta.
 */
export function SleepQuickCard({ onSubmit, isSubmitting }: SleepQuickCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hours, setHours] = useState(8);
  const [quality, setQuality] = useState<SleepQuality>('Good');

  const handleSave = () => {
    onSubmit({
      date: getTodayDateKey(),
      durationMinutes: hours * 60,
      quality,
    });
  };

  if (!expanded) {
    return (
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        activeOpacity={0.85}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4"
      >
        <IconTile name="moon" color={ROSE} size={56} />
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            Anoche
          </Text>
          <Text className="text-white text-lg font-bold mt-0.5">
            Registrá tu sueño
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#71717a" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <View className="flex-row items-center gap-4">
        <IconTile name="moon" color={ROSE} size={56} />
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            Anoche
          </Text>
          <Text className="text-white text-lg font-bold mt-0.5">
            ¿Cuánto dormiste?
          </Text>
        </View>
      </View>

      {/* Duración (stepper de horas) */}
      <View className="flex-row items-center justify-between">
        <Text className="text-zinc-300 text-base">Duración</Text>
        <QuantityStepper
          value={hours}
          onChange={setHours}
          step={1}
          min={1}
          max={12}
          unit="h"
          accent="rose"
        />
      </View>

      {/* Calidad */}
      <View className="gap-2">
        <Text className="text-zinc-300 text-base">Calidad</Text>
        <View className="flex-row flex-wrap gap-2">
          {QUALITY_ORDER.map((q) => (
            <SelectablePill
              key={q}
              label={SLEEP_QUALITY_LABELS[q]}
              selected={quality === q}
              onPress={() => setQuality(q)}
              accent="rose"
              className="px-3 py-2"
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={isSubmitting}
        activeOpacity={0.85}
        className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
          isSubmitting ? 'bg-rose-400/50' : 'bg-rose-400'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#18181b" />
        ) : (
          <Text className="text-zinc-900 font-bold text-base">Guardar sueño</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
