import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSectionScreen } from '@/src/components/features/profile/ProfileSectionScreen';
import { CreditsAddonCard } from '@/src/components/features/subscription/CreditsAddonCard';
import {
  MockPurchaseSheet,
  PurchaseSheetItem,
} from '@/src/components/features/subscription/MockPurchaseSheet';
import { PaywallView } from '@/src/components/features/subscription/PaywallView';
import { SubscriptionStatusCard } from '@/src/components/features/subscription/SubscriptionStatusCard';
import { useCreditsAddon } from '@/src/hooks/useCreditsAddon';
import { usePurchaseFlow } from '@/src/hooks/usePurchaseFlow';
import { useSubscription } from '@/src/store/subscription-context';
import {
  CREDITS_ADDON_REFERENCE_PRICE,
  PlanViewModel,
} from '@/src/types/subscription';

/**
 * Ruta de Suscripción dentro del Perfil: el estado real de `GET /me` (Fase 1)
 * seguido del add-on de créditos (Fase 4), el paywall de comparación de planes
 * (Fase 2) y el flujo de compra emulado (Fase 3).
 *
 * Las hojas de compra (`MockPurchaseSheet`) se renderizan como **hermanas** del
 * `ScrollView` para que su overlay absoluto cubra la pantalla en vez de quedar
 * atrapado (y scrollear) dentro del contenido.
 */
export default function SubscriptionProfileScreen() {
  const insets = useSafeAreaInsets();
  const { purchase, isPurchasing } = usePurchaseFlow();
  const { refresh, refreshCredits } = useSubscription();
  const [sheetPlan, setSheetPlan] = useState<PlanViewModel | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // El saldo cambia con cada acción de IA y el estado de la suscripción lo mueven los webhooks
  // del proveedor; el contexto solo consulta ambos al arrancar la app. Al entrar acá los releemos:
  // es LA pantalla donde el plan y el número tienen que estar bien.
  useEffect(() => {
    void refresh();
    void refreshCredits();
  }, [refresh, refreshCredits]);

  /**
   * Pull-to-refresh: el gesto que el usuario ya espera en una pantalla de estado, y la única
   * forma de traer un cambio del proveedor sin salir de la app (volver del segundo plano también
   * revalida, pero eso no sirve si nunca se fue). `refresh` no toca `isLoading`, así que la
   * tarjeta no se reemplaza por un loader: el contenido se queda quieto y solo gira el spinner.
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refresh(), refreshCredits()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, refreshCredits]);

  // Para el upsell del add-on (usuario Free): bajar el scroll hasta el paywall.
  const scrollRef = useRef<ScrollView>(null);
  const paywallY = useRef(0);
  const scrollToPaywall = () => scrollRef.current?.scrollTo({ y: paywallY.current, animated: true });

  const {
    buyAddon,
    isPurchasing: isBuyingAddon,
    product: addonProduct,
    isLoadingProduct,
  } = useCreditsAddon({ onNeedPlan: scrollToPaywall });
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);

  // Item de la hoja de compra del add-on (Fase 4).
  const addonItem: PurchaseSheetItem = {
    title: '+10 créditos',
    subtitle: 'Pack consumible · se suma a tu saldo',
    price: addonProduct?.localizedPrice ?? CREDITS_ADDON_REFERENCE_PRICE,
    premium: false,
    icon: 'sparkles-outline',
  };

  return (
    <ProfileSectionScreen title="Suscripción">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#a1a1aa"
            colors={['#a1a1aa']}
          />
        }
      >
        <SubscriptionStatusCard />
        <CreditsAddonCard
          product={addonProduct}
          isLoading={isLoadingProduct}
          onBuy={() => setAddonSheetOpen(true)}
        />
        <View onLayout={(e) => (paywallY.current = e.nativeEvent.layout.y)}>
          <PaywallView onChoosePlan={setSheetPlan} />
        </View>
      </ScrollView>

      {sheetPlan ? (
        <MockPurchaseSheet
          item={{
            title: sheetPlan.name,
            subtitle: sheetPlan.billingInterval === 'Annual' ? 'Cobro anual' : 'Cobro mensual',
            price: sheetPlan.localizedPrice,
            premium: sheetPlan.tier !== 'Free',
          }}
          isPurchasing={isPurchasing}
          onConfirm={() => purchase(sheetPlan)}
          onDismiss={() => setSheetPlan(null)}
        />
      ) : null}

      {addonSheetOpen ? (
        <MockPurchaseSheet
          item={addonItem}
          isPurchasing={isBuyingAddon}
          onConfirm={() => buyAddon()}
          onDismiss={() => setAddonSheetOpen(false)}
        />
      ) : null}
    </ProfileSectionScreen>
  );
}
