import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** Acento del estado seleccionado en la variante `radio`. */
export type CheckableAccent = 'lime' | 'amber' | 'mono';

const RADIO_BORDER: Record<CheckableAccent, string> = {
  lime: 'border-lime-400',
  amber: 'border-amber-400',
  mono: 'border-zinc-100',
};

const RADIO_CHECK: Record<CheckableAccent, string> = {
  lime: 'text-lime-400',
  amber: 'text-amber-400',
  mono: 'text-white',
};

interface CheckableCardProps {
  /** Si está seleccionado */
  isSelected: boolean;
  /** Título del ítem */
  label: string;
  /** Descripción opcional */
  description?: string;
  /** Callback al presionar */
  onPress: () => void;
  /**
   * Estilo visual:
   * - `fill` (default): seleccionado = relleno invertido `zinc-50` + check oscuro (sub-objetivos, multi-select).
   * - `radio`: card siempre `zinc-900`; seleccionado = borde + check del acento, label blanco (selector único de la maqueta).
   */
  variant?: 'fill' | 'radio';
  /** Acento del estado seleccionado en variante `radio`. Default `mono`. */
  accent?: CheckableAccent;
}

/**
 * Tarjeta de lista seleccionable con indicador a la derecha.
 * - `fill`: usada en sub-objetivos (multi-select, relleno invertido).
 * - `radio`: usada en selectores únicos tipo maqueta (fondo oscuro, borde + check del acento).
 */
export default function CheckableCard({
  isSelected,
  label,
  description,
  onPress,
  variant = 'fill',
  accent = 'mono',
}: CheckableCardProps) {
  if (variant === 'radio') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center p-4 rounded-2xl border bg-zinc-900 ${
          isSelected ? RADIO_BORDER[accent] : 'border-zinc-800'
        }`}
      >
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-white">{label}</Text>
          {description ? (
            <Text className="text-sm mt-1 text-zinc-400">{description}</Text>
          ) : null}
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={24} className={RADIO_CHECK[accent]} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} className="text-zinc-600" />
        )}
      </TouchableOpacity>
    );
  }

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
        <Ionicons name="checkmark-circle" size={24} className="text-white dark:text-slate-900" />
      ) : (
        <Ionicons name="ellipse-outline" size={24} className="text-slate-400" />
      )}
    </TouchableOpacity>
  );
}
