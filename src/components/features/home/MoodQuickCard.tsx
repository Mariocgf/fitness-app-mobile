import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { MoodLevel } from '@/src/types/wellness';
import { MOOD_LABELS, MOOD_LEVELS_ORDERED } from '@/src/utils/wellness.utils';

/** Emoji por nivel de ánimo (peor → mejor). Es etiqueta visual, no dato del backend. */
const MOOD_EMOJI: Record<MoodLevel, string> = {
  VeryBad: '😣',
  Bad: '🙁',
  Neutral: '😐',
  Good: '🙂',
  VeryGood: '😄',
};

interface MoodQuickCardProps {
  /** Registra el ánimo elegido (de un toque). */
  onSelect: (mood: MoodLevel) => void;
  /** Deshabilita los botones mientras se persiste. */
  isSubmitting: boolean;
}

/**
 * Registro rápido de ánimo del Home (dark-only zinc, acento rose-400). Cinco
 * emojis de UN toque: al tocar uno se persiste el ánimo de hoy y la card
 * desaparece (la decide el padre según `wellness.mood`). El form completo (con
 * nota) vive en el módulo Salud.
 */
export function MoodQuickCard({ onSelect, isSubmitting }: MoodQuickCardProps) {
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <View>
        <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
          ¿Cómo te sentís?
        </Text>
        <Text className="text-white text-lg font-bold mt-0.5">
          Registrá tu ánimo
        </Text>
      </View>

      <View className="flex-row justify-between">
        {MOOD_LEVELS_ORDERED.map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => onSelect(level)}
            disabled={isSubmitting}
            activeOpacity={0.7}
            className={`items-center gap-1.5 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            <View className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center">
              <Text className="text-2xl">{MOOD_EMOJI[level]}</Text>
            </View>
            <Text className="text-zinc-400 text-[11px]">{MOOD_LABELS[level]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
