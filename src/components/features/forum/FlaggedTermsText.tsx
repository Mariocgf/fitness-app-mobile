import React, { useMemo } from 'react';
import { Text } from 'react-native';

/** Escapa metacaracteres de regex para armar el patrón desde texto plano del backend. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface FlaggedTermsTextProps {
  text: string;
  terms: string[];
  className?: string;
}

/**
 * Renderiza el texto resaltando en rojo los términos marcados por el filtro de contenido
 * (422 `FlaggedTerms`). Es un preview read-only: los `TextInput` de RN no pintan rangos
 * internos (ni en nativo ni en web), así que este preview acompaña al input para que el
 * usuario vea exactamente qué palabras cambiar.
 */
export function FlaggedTermsText({ text, terms, className = '' }: FlaggedTermsTextProps) {
  const parts = useMemo(() => {
    if (terms.length === 0) return [{ value: text, flagged: false }];
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
    const lowered = terms.map((t) => t.toLowerCase());
    return text
      .split(pattern)
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => ({ value: chunk, flagged: lowered.includes(chunk.toLowerCase()) }));
  }, [text, terms]);

  return (
    <Text className={className}>
      {parts.map((part, index) =>
        part.flagged ? (
          <Text key={index} className="bg-red-500/30 text-red-300 font-semibold">
            {part.value}
          </Text>
        ) : (
          part.value
        ),
      )}
    </Text>
  );
}
