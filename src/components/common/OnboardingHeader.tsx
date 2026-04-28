import React from 'react';
import { Text, View } from 'react-native';

interface OnboardingHeaderProps {
  /** Título principal */
  title: string;
  /** Subtítulo */
  subtitle: string;
}

/**
 * Cabecera de pantallas de onboarding con título y subtítulo.
 */
export default function OnboardingHeader({ title, subtitle }: OnboardingHeaderProps) {
  return (
    <View>
      <Text className="text-[34px] font-bold text-slate-900 dark:text-white">
        {title}
      </Text>
      <Text className="text-lg text-slate-500 dark:text-zinc-400 mb-8">
        {subtitle}
      </Text>
    </View>
  );
}
