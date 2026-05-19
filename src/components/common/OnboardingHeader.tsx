import React from 'react';
import { Text, View } from 'react-native';

interface OnboardingHeaderProps {
  /** Título principal - puede contener \n para saltos de línea */
  title: string;
  /** Subtítulo */
  subtitle: string;
  /** Si true, fuerza texto blanco (para fondos oscuros) */
  inverted?: boolean;
}

/**
 * Cabecera de pantallas de onboarding con título y subtítulo.
 * Respetando colores de colors.md
 * El título admite saltos de línea con \n
 */
export default function OnboardingHeader({ title, subtitle, inverted = false }: OnboardingHeaderProps) {
  return (
    <View>
      <Text className={`text-[42px] font-bold leading-[1] ${
        inverted ? 'text-white' : 'text-slate-900 dark:text-slate-50'
      }`}>
        {title}
      </Text>
      <Text className={`text-lg mt-2 mb-8 ${
        inverted ? 'text-white/60' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {subtitle}
      </Text>
    </View>
  );
}
