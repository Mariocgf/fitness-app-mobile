import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastEntry, ToastVariant, toast, useToastEntries } from './toast';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface VariantStyle {
  icon: IoniconName;
  /** Color del ícono y del borde de acento. */
  accent: string;
}

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  success: { icon: 'checkmark-circle', accent: '#d9f99d' },
  error: { icon: 'alert-circle', accent: '#f87171' },
  warning: { icon: 'warning', accent: '#fbbf24' },
  info: { icon: 'information-circle', accent: '#a1a1aa' },
};

function ToastCard({ entry }: { entry: ToastEntry }) {
  const variant = VARIANTS[entry.variant];

  return (
    <Animated.View
      entering={FadeInDown.duration(280).easing(Easing.out(Easing.quad))}
      exiting={FadeOutUp.duration(220).easing(Easing.in(Easing.quad))}
    >
      <Pressable
        onPress={() => toast.dismiss(entry.id)}
        className="flex-row items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/95 px-4 py-3"
        style={{
          borderLeftColor: variant.accent,
          borderLeftWidth: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name={variant.icon} size={20} color={variant.accent} style={{ marginTop: 1 }} />
        <View className="flex-1">
          {entry.title ? (
            <Text className="text-sm font-semibold text-zinc-100">{entry.title}</Text>
          ) : null}
          <Text className={entry.title ? 'text-sm leading-5 text-zinc-400' : 'text-sm leading-5 text-zinc-100'}>
            {entry.message}
          </Text>
          {entry.action ? (
            // Pressable anidado: en RN el hijo toma el responder, así que tocar el CTA
            // no dispara el onPress de la card (que solo descarta el toast).
            <Pressable
              onPress={() => {
                toast.dismiss(entry.id);
                entry.action?.onPress();
              }}
              hitSlop={8}
              className="mt-2 self-start rounded-lg border px-3 py-1.5"
              style={{ borderColor: variant.accent }}
            >
              <Text className="text-xs font-semibold" style={{ color: variant.accent }}>
                {entry.action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Renderiza la pila de toasts arriba de todo. Se monta una sola vez en el layout
 * raíz. No bloquea la interacción con el resto de la pantalla.
 */
export function ToastHost() {
  const entries = useToastEntries();
  const insets = useSafeAreaInsets();

  if (entries.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 z-50"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View
        pointerEvents="box-none"
        className="w-full self-center gap-2 px-4"
        style={{ maxWidth: 480 }}
      >
        {entries.map((entry) => (
          <ToastCard key={entry.id} entry={entry} />
        ))}
      </View>
    </View>
  );
}
