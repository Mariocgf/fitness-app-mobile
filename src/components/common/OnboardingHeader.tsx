import React from 'react';
import { Text, View } from 'react-native';

interface OnboardingHeaderProps {
  /** Título principal - puede contener \n para saltos de línea */
  title: string;
  /** Subtítulo */
  subtitle: string;
  /** Si true, fuerza texto blanco (para fondos oscuros) */
  inverted?: boolean;
  /** Si true, centra título y subtítulo (maqueta de Datos básicos) */
  centered?: boolean;
}

/**
 * Cabecera de pantallas de onboarding con título y subtítulo.
 * Respetando colores de colors.md
 * El título admite saltos de línea con \n
 */
export default function OnboardingHeader({ title, subtitle, inverted = false, centered = false }: OnboardingHeaderProps) {
  return (
    <View className={centered ? 'items-center' : ''}>
      <Text className={`text-[42px] font-bold leading-[1] ${centered ? 'text-center' : ''} ${
        inverted ? 'text-white' : 'text-white'
      }`}>
        {title}
      </Text>
      <Text className={`text-lg mt-2 mb-8 ${centered ? 'text-center' : ''} ${
        inverted ? 'text-white/60' : 'text-zinc-400'
      }`}>
        {subtitle}
      </Text>
    </View>
  );
}
