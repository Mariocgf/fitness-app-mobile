import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface OnboardingFooterProps {
  /** Color de fondo del botón */
  brandColor: string;
  /** Callback al presionar el botón */
  onPress: () => void;
  /** Texto de ayuda que aparece encima del botón (opcional) */
  helperText?: string;
  /** Si el botón debe estar deshabilitado */
  disabled?: boolean;
  /** Texto del botón (default: 'Continuar') */
  buttonLabel?: string;
}

/**
 * Footer fijo con botón de acción para pantallas de onboarding.
 * Se posiciona fuera del ScrollView para no ser afectado por el teclado.
 */
export default function OnboardingFooter({
  brandColor,
  onPress,
  helperText,
  disabled = false,
  buttonLabel = 'Continuar',
}: OnboardingFooterProps) {
  return (
    <View
      className="px-8 bg-white dark:bg-zinc-900"
      style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16 }}
    >
      {helperText ? (
        <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-4 px-6 leading-5">
          {helperText}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[{ backgroundColor: brandColor }, disabled && { opacity: 0.7 }]}
        className="w-full py-5 rounded-2xl items-center shadow-md"
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text className="text-white text-lg font-bold">{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
