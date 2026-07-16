import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { CREDITS_ADDON_REFERENCE_PRICE, StoreProduct } from '@/src/types/subscription';

interface CreditsAddonCardProps {
  /** Producto del store/emulador (para el precio). `null` → usar precio de referencia. */
  product: StoreProduct | null;
  /** Mientras se resuelve el precio del store. */
  isLoading: boolean;
  /** Abre la hoja de compra emulada del add-on. */
  onBuy: () => void;
}

/**
 * Card para comprar el pack consumible de +10 créditos. Vive en la pantalla de
 * Suscripción, siempre visible: si el usuario es Free, el backend responde
 * `granted: false` y el hook dispara el upsell al paywall.
 *
 * El add-on es consumible: se puede comprar varias veces (cada una suma +10), por
 * eso la card no se bloquea tras una compra.
 */
export const CreditsAddonCard: React.FC<CreditsAddonCardProps> = ({
  product,
  isLoading,
  onBuy,
}) => {
  const price = product?.localizedPrice ?? CREDITS_ADDON_REFERENCE_PRICE;

  return (
    <View className="px-5 pt-6">
      <View className="rounded-3xl bg-zinc-900 p-5">
        <View className="flex-row items-center">
          <IconTile name="sparkles-outline" color="#a1a1aa" />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-bold text-zinc-100">+10 créditos</Text>
            <Text className="mt-0.5 text-sm text-zinc-500">Pack consumible · se suma a tu saldo</Text>
          </View>
          {isLoading ? (
            <View className="h-7 w-16 rounded-lg bg-zinc-800" />
          ) : (
            <Text className="text-2xl font-bold text-zinc-50">{price}</Text>
          )}
        </View>

        <Pressable
          onPress={onBuy}
          className="mt-5 h-14 flex-row items-center justify-center rounded-2xl bg-zinc-50 px-6"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-base font-semibold text-zinc-950">Comprar créditos</Text>
        </Pressable>
      </View>
    </View>
  );
};
