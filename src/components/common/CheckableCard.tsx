import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface CheckableCardProps {
  /** Si está seleccionado */
  isSelected: boolean;
  /** Título del ítem */
  label: string;
  /** Descripción opcional */
  description?: string;
  /** Callback al presionar */
  onPress: () => void;
}

/**
 * Tarjeta de lista seleccionable con indicador de check a la derecha.
 * Usada para sub-objetivos y opciones tipo "list item".
 * Sin sombra — borde slate-200 según design system.
 */
export default function CheckableCard({ isSelected, label, description, onPress }: CheckableCardProps) {
  const colorScheme = useColorScheme();
  const checkmarkColor = colorScheme === 'dark' ? '#0f172a' : '#ffffff';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center p-4 rounded-2xl border-2 ${
        isSelected
          ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <View className="flex-1 mr-3">
        <Text
          className={`text-base font-bold ${
            isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {label}
        </Text>
        {description ? (
          <Text
            className={`text-sm mt-1 ${
              isSelected ? 'text-white/70 dark:text-slate-900/70' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {isSelected ? (
        <Ionicons name="checkmark-circle" size={24} color={checkmarkColor} />
      ) : (
        <Ionicons name="ellipse-outline" size={24} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );
}
