import React from 'react';
import { Text, View } from 'react-native';

interface FieldSectionProps {
  /** Etiqueta superior en mayúsculas (eyebrow), ej. "NIVEL DE EXPERIENCIA" */
  eyebrow: string;
  /** Pregunta/subtítulo bajo la etiqueta, ej. "¿Cuál es tu punto de partida?" */
  question: string;
  /** Control de la sección (segmented, lista, etc.) */
  children: React.ReactNode;
  /** Clases extra del contenedor */
  className?: string;
}

/**
 * Encabezado de sección de formulario SIN card (dark-only zinc): etiqueta en
 * mayúsculas + pregunta y, debajo, el control. Es la versión sin chrome de
 * `SectionCard` (que sí envuelve en una card con círculo de ícono).
 *
 * Reutilizar SIEMPRE en pasos de onboarding/perfil donde la maqueta muestra el
 * campo "al aire" (eyebrow + pregunta + control) en vez de copiar el bloque
 * `<Text uppercase/><Text/><control/>`.
 */
export default function FieldSection({ eyebrow, question, children, className }: FieldSectionProps) {
  return (
    <View className={className}>
      <Text className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
        {eyebrow}
      </Text>
      <Text className="text-lg text-white mb-4">{question}</Text>
      {children}
    </View>
  );
}
