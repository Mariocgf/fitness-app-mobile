import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { useSubscription } from '@/src/store/subscription-context';

/**
 * Umbral de "saldo bajo" = costo de la acción de IA más cara (generar rutina = 3).
 * Por debajo de esto el usuario ya no puede generar, así que lo avisamos en ámbar
 * ANTES de que se coma un 402.
 */
const LOW_BALANCE_THRESHOLD = 3;

/**
 * Contador de créditos. Pill compacto que muestra el saldo real del wallet y lleva al
 * paywall al tocarlo.
 *
 * Es un componente **inline**, NO un overlay flotante. Se probó flotarlo desde el layout
 * raíz y quedaba dentro de la barra de estado: al vivir fuera del `SafeAreaView` de las
 * pantallas había que recalcular el safe-area a mano (`insets.top`), y ese inset llega
 * en **0** en web/PWA y en Android edge-to-edge. La solución prolija es no pelear con el
 * layout: se renderiza DENTRO del header de cada pantalla, donde el `SafeAreaView` ya
 * resolvió los insets. Cero matemática de posición.
 *
 * Se monta en los headers de Home, Fitness y Nutrición. Salud no lo renderiza (pedido del
 * producto), y el paywall tampoco (la `SubscriptionStatusCard` ya muestra el saldo).
 *
 * No hace fetch: lee el saldo del `SubscriptionProvider`, que lo actualiza cuando el bus
 * de créditos avisa que una acción tocó el wallet (ver `credits-events.ts`).
 */
export const CreditsBadge: React.FC = () => {
  const { credits } = useSubscription();
  const router = useRouter();

  // `null` = todavía no sabemos el saldo. No renderizamos un placeholder: un badge vacío
  // o un "—" colgado llama la atención sin aportar nada.
  if (credits === null) return null;

  const isLow = credits < LOW_BALANCE_THRESHOLD;
  const accent = isLow ? '#fbbf24' : '#a3e635';

  return (
    <Pressable
      onPress={() => router.push('/profile/subscription')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${credits} créditos disponibles. Tocá para comprar más.`}
      className="flex-row items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name="flash" size={15} color={accent} />
      <Text className="text-sm font-bold" style={{ color: accent }}>
        {credits}
      </Text>
    </Pressable>
  );
};
