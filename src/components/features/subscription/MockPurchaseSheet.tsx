import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientText } from '@/src/components/common/GradientText';
import { IconTile } from '@/src/components/common/IconTile';
import { getPurchasePlatform } from '@/src/services/purchase';
import { PurchasePlatform } from '@/src/types/subscription';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Acento premium puntual (violeta → índigo) para el clímax "Premium". */
const PREMIUM_GRADIENT = ['#a78bfa', '#818cf8'] as const;

/** Etiqueta neutra de la plataforma detectada (sin imitar marcas del store). */
const platformLabel = (platform: PurchasePlatform): string =>
  platform === 'Ios' ? 'iOS · App Store' : 'Android · Google Play';

/**
 * Layout del overlay en `StyleSheet` y NO en `className`.
 *
 * Un `Animated.View` que recibe estilos animados ignora las clases de NativeWind
 * en web (reanimated toma el control del prop `style`): sin esto la hoja pierde
 * `position: absolute` y su fondo, cae en el flujo normal y se apila arriba.
 * Misma lección que `ExerciseDetailView` / `RoutineDetailView`.
 */
const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090b', // zinc-950
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});

/**
 * Producto a comprar, ya en forma de presentación. Desacopla la hoja del modelo de
 * plan para reutilizarla también con el add-on de créditos (u otros consumibles).
 */
export interface PurchaseSheetItem {
  /** Nombre del producto (ej. "Plan Full" / "+10 créditos"). */
  title: string;
  /** Subtítulo bajo el nombre (ej. "Cobro anual" / "Pack consumible"). */
  subtitle: string;
  /** Precio localizado a mostrar (del store o de referencia). */
  price: string;
  /** Aplica el acento premium (gradiente violeta) al nombre y al ícono. */
  premium: boolean;
  /** Ícono del producto (default `diamond-outline`). */
  icon?: IoniconName;
}

interface MockPurchaseSheetProps {
  /** Producto a comprar (nombre, subtítulo, precio, acento). */
  item: PurchaseSheetItem;
  /** Estado de compra en curso (del hook): bloquea el CTA y muestra spinner. */
  isPurchasing: boolean;
  /** Dispara la compra (`provider.purchase` → validación en backend). Resuelve al terminar. */
  onConfirm: () => Promise<void>;
  /** Cierra y desmonta la hoja (cancelar / backdrop / post-compra). */
  onDismiss: () => void;
}

/**
 * Hoja de compra EMULADA (dev), platform-aware. Overlay absoluto con backdrop +
 * hoja que sube desde abajo — NUNCA `Modal` de RN (lección: flota sobre la
 * navegación y la tab bar). Es presentacional: la lógica de compra vive en
 * `usePurchaseFlow`; acá solo se dispara `onConfirm`.
 *
 * IMPORTANTE: debe renderizarse como **hermano del contenido scrolleable** (no
 * dentro del `ScrollView`), para que el `absolute inset-0` cubra el área de la
 * pantalla en vez de scrollear con el contenido.
 *
 * El layout del backdrop y de la hoja va en `StyleSheet` (ver `styles`), no en
 * `className`: NativeWind no llega a los `Animated.View` con estilo animado en web.
 *
 * Padding inferior = solo `insets.bottom`: la ruta de Perfil está fuera de
 * `(tabs)`, no tiene tab bar nativo.
 */
export const MockPurchaseSheet: React.FC<MockPurchaseSheetProps> = ({
  item,
  isPurchasing,
  onConfirm,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const platform = getPurchasePlatform();

  // 0 = cerrado (abajo / transparente), 1 = abierto. Travel = alto de pantalla
  // para garantizar que arranque fuera de cuadro sin necesidad de `measure()`
  // (que es inestable en web).
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  // Anima el cierre y recién ahí desmonta (via `onDismiss` en `runOnJS`).
  const animateClose = useCallback(() => {
    progress.value = withTiming(
      0,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  }, [onDismiss, progress]);

  const handleCancel = useCallback(() => {
    if (isPurchasing) return;
    animateClose();
  }, [animateClose, isPurchasing]);

  const handleConfirm = useCallback(async () => {
    await onConfirm();
    animateClose();
  }, [animateClose, onConfirm]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [screenHeight, 0]) }],
  }));

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop: oscurece el contenido y cierra al tocar afuera */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
      </Animated.View>

      {/* Hoja anclada abajo */}
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}>
        {/* Grabber */}
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-zinc-700" />

        {/* Cabecera: plataforma detectada + aviso de emulación */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {platformLabel(platform)}
          </Text>
          <View className="rounded-full bg-zinc-800 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-zinc-400">EMULADO · DEV</Text>
          </View>
        </View>

        {/* Producto */}
        <View className="mt-4 flex-row items-center">
          <IconTile
            name={item.icon ?? 'diamond-outline'}
            color={item.premium ? '#a78bfa' : '#a1a1aa'}
          />
          <View className="ml-4 flex-1">
            {item.premium ? (
              <GradientText className="text-lg font-bold" colors={PREMIUM_GRADIENT}>
                {item.title}
              </GradientText>
            ) : (
              <Text className="text-lg font-bold text-zinc-100">{item.title}</Text>
            )}
            <Text className="mt-0.5 text-sm text-zinc-500">{item.subtitle}</Text>
          </View>
          <Text className="text-2xl font-bold text-zinc-50">{item.price}</Text>
        </View>

        {/* Aviso de emulación (no inventar un cargo real) */}
        <View className="mt-4 flex-row items-start rounded-2xl bg-zinc-900 p-3">
          <Ionicons name="information-circle-outline" size={18} color="#a1a1aa" />
          <Text className="ml-2 flex-1 text-xs leading-5 text-zinc-400">
            Cobro simulado para desarrollo. No se realiza ningún cargo real; el receipt se valida
            contra el backend igual que una compra del store.
          </Text>
        </View>

        {/* CTA confirmar (botón primario canónico: bg-zinc-50 / text-zinc-950) */}
        <Pressable
          onPress={handleConfirm}
          disabled={isPurchasing}
          className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl px-6 ${
            isPurchasing ? 'bg-zinc-800' : 'bg-zinc-50'
          }`}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#a1a1aa" />
          ) : (
            <Text className="text-base font-semibold text-zinc-950">Confirmar compra</Text>
          )}
        </Pressable>

        {/* Cancelar */}
        <Pressable
          onPress={handleCancel}
          disabled={isPurchasing}
          className="mt-2 h-12 items-center justify-center rounded-2xl"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-sm font-medium text-zinc-400">Cancelar</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};
