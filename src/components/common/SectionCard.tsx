import React from 'react';
import { Text, View } from 'react-native';

interface SectionCardProps {
  /** Ícono a mostrar en el círculo izquierdo */
  icon: React.ReactNode;
  /** Título de la sección */
  title: string;
  /** Subtítulo descriptivo */
  subtitle: string;
  /** Contenido de la sección */
  children: React.ReactNode;
  /** Clases adicionales para el contenedor (ej: "mb-4") */
  className?: string;
}

/**
 * Tarjeta de sección reutilizable para onboarding (dark-only zinc).
 * Muestra ícono en círculo, título, subtítulo y contenido.
 * Sin sombra — solo borde zinc-800 según design system.
 */
export default function SectionCard({ icon, title, subtitle, children, className = '' }: SectionCardProps) {
  return (
    <View
      className={`bg-zinc-900 rounded-2xl p-5 border border-zinc-800 ${className}`}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-11 h-11 bg-zinc-800 rounded-full items-center justify-center mr-3">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">
            {title}
          </Text>
          <Text className="text-sm text-zinc-400">
            {subtitle}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
