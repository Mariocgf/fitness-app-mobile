import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

/** Escapa metacaracteres de regex para armar el patrón desde texto plano del backend. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SKY = '#38bdf8';

interface HighlightedTextInputProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Términos marcados (422): se resaltan DENTRO del cuadro. */
  terms: string[];
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  minHeight?: number;
  maxLength?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
  fontSize?: number;
  /** Clases del contenedor (borde/fondo/redondeo). El padding lo pone el propio componente. */
  containerClassName?: string;
}

/**
 * TextInput que resalta los términos marcados (422) DENTRO del cuadro con la técnica de
 * "backdrop": un `<Text>` detrás pinta SOLO los rectángulos de resaltado (texto transparente)
 * y el `TextInput` encima muestra el texto real + el cursor. Ambos comparten EXACTAMENTE la
 * misma tipografía y padding para que los rectángulos caigan justo detrás de cada palabra.
 *
 * Funciona en nativo y en web/PWA: no depende de pasarle `<Text>` con formato al TextInput
 * (que RN web no soporta) ni de volver el texto transparente (el cursor sigue visible).
 */
export function HighlightedTextInput({
  value,
  onChangeText,
  terms,
  placeholder,
  placeholderTextColor,
  multiline,
  minHeight,
  maxLength,
  autoFocus,
  onFocus,
  fontSize = 16,
  containerClassName = '',
}: HighlightedTextInputProps) {
  const lineHeight = Math.round(fontSize * 1.5);
  const typography = { fontSize, lineHeight };

  const hasHighlight = terms.length > 0 && value.length > 0;

  const parts = useMemo(() => {
    if (!hasHighlight) return [];
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
    const lowered = terms.map((t) => t.toLowerCase());
    return value
      .split(pattern)
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => ({ value: chunk, flagged: lowered.includes(chunk.toLowerCase()) }));
  }, [value, terms, hasHighlight]);

  return (
    <View className={containerClassName}>
      {/* Backdrop: pinta los rectángulos de resaltado detrás del texto real. */}
      {hasHighlight && (
        <Text
          pointerEvents="none"
          style={[styles.backdrop, styles.boxPadding, typography]}
        >
          {parts.map((part, index) => (
            <Text key={index} style={part.flagged ? styles.mark : styles.hidden}>
              {part.value}
            </Text>
          ))}
        </Text>
      )}

      {/* Input real, encima. Texto y cursor visibles; fondo transparente. */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={onFocus}
        textAlignVertical="top"
        selectionColor={SKY}
        style={[styles.input, styles.boxPadding, typography, minHeight ? { minHeight } : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxPadding: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Palabra marcada: rectángulo rojo detrás, texto transparente (lo pinta el input de arriba).
  mark: {
    color: 'transparent',
    backgroundColor: 'rgba(239, 68, 68, 0.45)',
  },
  // Resto del texto en el backdrop: invisible (solo ocupa espacio para alinear).
  hidden: {
    color: 'transparent',
  },
  input: {
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
});
