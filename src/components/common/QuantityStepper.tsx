import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

/** Color del acento de los botones +/-. */
const ACCENT_COLORS = {
  amber: '#fbbf24',
  lime: '#a3e635',
  rose: '#fb7185',
  mono: '#fafafa',
} as const;

type StepperAccent = keyof typeof ACCENT_COLORS;

interface QuantityStepperProps {
  /** Valor actual */
  value: number;
  /** Se invoca con el nuevo valor ya acotado a [min, max] */
  onChange: (value: number) => void;
  /** Incremento por toque (default 5) */
  step?: number;
  /** Mínimo permitido (default 0) */
  min?: number;
  /** Máximo permitido (default 9999) */
  max?: number;
  /** Unidad mostrada junto al valor (default `g`) */
  unit?: string;
  /** Color del acento de los botones (default `amber`) */
  accent?: StepperAccent;
  /** Si es true, tocar el valor permite escribirlo directo con el teclado. Default false. */
  editable?: boolean;
  /** Si es true (y editable), permite tipear decimales (ej. 2.5). Default false. */
  decimal?: boolean;
}

/** Redondea a 2 decimales y saca ceros sobrantes: 2.5 → "2.5", 2 → "2". */
const formatDecimal = (n: number): string => String(Math.round(n * 100) / 100);

/** Botón circular con borde del acento para +/-. */
function StepButton({
  icon,
  color,
  disabled,
  onPress,
}: {
  icon: 'remove' | 'add';
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={{ borderColor: color, opacity: disabled ? 0.35 : 1 }}
      className="w-10 h-10 rounded-full border items-center justify-center"
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

/**
 * Átomo de selector de cantidad: `−  valor unidad  +`. Dos botones circulares con
 * el valor centrado. No usa gestos propios (solo toques), así que puede vivir
 * dentro de un `Pressable` o `ScrollView` sin pelearse con el responder system.
 * Reutilizar SIEMPRE en vez de copiar el bloque de dos botones con un valor en medio.
 */
export function QuantityStepper({
  value,
  onChange,
  step = 5,
  min = 0,
  max = 9999,
  unit = 'g',
  accent = 'amber',
  editable = false,
  decimal = false,
}: QuantityStepperProps) {
  const color = ACCENT_COLORS[accent];

  /* ── Edición directa por teclado (opt-in) ──────────────────────────────── */
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = decimal ? formatDecimal(value) : String(Math.round(value));

  const beginEdit = () => {
    if (!editable) return;
    setDraft(displayValue);
    setIsEditing(true);
  };

  /** Limpia el texto tipeado: solo dígitos (y un separador decimal si `decimal`). */
  const sanitize = (t: string): string => {
    if (!decimal) return t.replace(/[^0-9]/g, '');
    // El decimal-pad nativo usa coma en locales como es-AR: la aceptamos y la
    // normalizamos a punto (parseFloat solo entiende punto). Deja el primer punto
    // y colapsa los extra.
    const cleaned = t.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot === -1) return cleaned;
    return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  };

  /** Acota el texto tipeado a [min, max] y lo confirma. Vacío → min. */
  const commitEdit = () => {
    const parsed = decimal ? parseFloat(draft) : parseInt(draft, 10);
    const next = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
    onChange(next);
    setIsEditing(false);
  };

  return (
    <View className="flex-row items-center justify-between gap-3 bg-zinc-800/60 rounded-full px-2 py-1.5">
      <StepButton
        icon="remove"
        color={color}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
      />
      {isEditing ? (
        <TextInput
          value={draft}
          onChangeText={(t) => setDraft(sanitize(t))}
          onBlur={commitEdit}
          onSubmitEditing={commitEdit}
          autoFocus
          selectTextOnFocus
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          returnKeyType="done"
          maxLength={decimal ? 7 : 5}
          style={{ padding: 0 }}
          className="text-white text-base font-semibold text-center min-w-[48px]"
        />
      ) : (
        <Pressable onPress={beginEdit} disabled={!editable} hitSlop={6}>
          <Text className="text-white text-base font-semibold text-center min-w-[24px]">
            {displayValue}{unit ? ` ${unit}` : ''}
          </Text>
        </Pressable>
      )}
      <StepButton
        icon="add"
        color={color}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
      />
    </View>
  );
}
