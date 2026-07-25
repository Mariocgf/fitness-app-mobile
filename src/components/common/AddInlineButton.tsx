import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

/** Acento de módulo: `lime` = Fitness, `amber` = Nutrición (ver `colors.md`). */
type Accent = 'lime' | 'amber';

const ACCENT_STYLES: Record<Accent, { border: string; bg: string; text: string; hex: string }> = {
  lime: {
    border: 'border-lime-400',
    bg: 'bg-lime-400/10',
    text: 'text-lime-400',
    hex: '#a3e635',
  },
  amber: {
    border: 'border-amber-400',
    bg: 'bg-amber-400/10',
    text: 'text-amber-400',
    hex: '#fbbf24',
  },
};

interface AddInlineButtonProps {
  label: string;
  onPress: () => void;
  /** Acento del módulo que lo consume. Por defecto `lime` (Fitness). */
  accent?: Accent;
}

/**
 * Botón "Agregar" con borde y relleno tenue del acento del módulo.
 * Abre un editor inline o navega a la vista de configuración correspondiente.
 */
export default function AddInlineButton({
  label,
  onPress,
  accent = 'lime',
}: AddInlineButtonProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-row items-center justify-center py-3 rounded-2xl border ${styles.border} ${styles.bg}`}
    >
      <Ionicons name="add" size={18} color={styles.hex} />
      <Text className={`${styles.text} font-semibold text-sm ml-1.5`}>{label}</Text>
    </TouchableOpacity>
  );
}
