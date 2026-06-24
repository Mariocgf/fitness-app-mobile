import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface OnboardingFooterProps {
  /** Callback al presionar el botón */
  onPress: () => void;
  /** Texto de ayuda que aparece encima del botón (opcional) */
  helperText?: string;
  /** Texto del helper con icono (opcional) */
  helperIcon?: React.ReactNode;
  /** Si el botón debe estar deshabilitado */
  disabled?: boolean;
  /** Texto del botón (default: 'Continuar') */
  buttonLabel?: string;
  /** Color de marca (legacy - ahora usa colors.md por defecto) */
  brandColor?: string;
  /** Si true, usa estilos claros para fondos oscuros (botón blanco, helper texto blanco) */
  inverted?: boolean;
}

/**
 * Footer fijo con botón de acción para pantallas de onboarding.
 * Se posiciona fuera del ScrollView para no ser afectado por el teclado.
 * Colores según colors.md: botón zinc-950/zinc-50 (acento de marca)
 */
export default function OnboardingFooter({
  onPress,
  helperText,
  helperIcon,
  disabled = false,
  buttonLabel = 'Continuar',
  brandColor,
  inverted = false,
}: OnboardingFooterProps) {
  const buttonStyle = brandColor ? { backgroundColor: brandColor } : {};

  const buttonClass = brandColor
    ? ''
    : inverted
      ? `${disabled ? 'bg-white/50' : 'bg-white'}`
      : `${disabled ? 'bg-zinc-50/50' : 'bg-zinc-50'}`;

  const textClass = brandColor
    ? 'text-white'
    : inverted
      ? 'text-zinc-950'
      : 'text-zinc-950';

  const helperTextClass = inverted
    ? 'text-sm text-white/60 ml-2 leading-5 flex-1'
    : 'text-sm text-zinc-400 ml-2 leading-5 flex-1';

  return (
    <View
      className="px-6"
      style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16 }}
    >
      {helperText ? (
        <View className="flex-row items-center justify-center mb-4 px-6">
          {helperIcon}
          <Text className={helperTextClass}>
            {helperText}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={buttonStyle}
        className={`w-full py-5 rounded-full items-center ${buttonClass}`}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text className={`${textClass} text-lg font-bold`}>
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
