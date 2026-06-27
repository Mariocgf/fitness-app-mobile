import React, { useCallback, useRef } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WellnessView } from "@/src/components/features/health/wellness/WellnessView";
import { useWellnessDashboard } from "@/src/hooks/useWellnessDashboard";
import { getWellnessDataVersion } from "@/src/store/wellness-sync";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

/**
 * Pantalla de Bienestar (sub-ruta del tab Salud). Contenedor liviano: consume el
 * dashboard de hábitos y delega el render a `WellnessView`.
 * Las acciones de registro (formularios) se cablean en una fase futura.
 */
export default function WellnessScreen() {
  const router = useRouter();
  const { today, recentActivity, isLoading, error, refresh } =
    useWellnessDashboard();

  const handleOpenSleep = useCallback(() => {
    router.push("/health/sleep" as any);
  }, [router]);

  const handleOpenHydration = useCallback(() => {
    router.push("/health/hydration" as any);
  }, [router]);

  const handleOpenMood = useCallback(() => {
    router.push("/health/mood" as any);
  }, [router]);

  const handleRegisterSleep = useCallback(() => {
    router.push("/health/sleep-new" as any);
  }, [router]);

  const handleRegisterHydration = useCallback(() => {
    router.push("/health/hydration-new" as any);
  }, [router]);

  const handleRegisterMood = useCallback(() => {
    router.push("/health/mood-new" as any);
  }, [router]);

  // Solo refresca si hubo una mutación real (registrar/eliminar) desde la última
  // carga: volver de una vista de lectura no debe llamar a la API al pedo.
  // El hook ya carga en mount, así que arrancamos con la versión actual ya vista.
  const lastVersionRef = useRef(getWellnessDataVersion());
  useFocusEffect(
    useCallback(() => {
      const current = getWellnessDataVersion();
      if (current !== lastVersionRef.current) {
        lastVersionRef.current = current;
        refresh();
      }
    }, [refresh]),
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow"
      >
        <WellnessView
          today={today}
          recentActivity={recentActivity}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          onOpenSleep={handleOpenSleep}
          onOpenHydration={handleOpenHydration}
          onOpenMood={handleOpenMood}
          onRegisterSleep={handleRegisterSleep}
          onRegisterHydration={handleRegisterHydration}
          onRegisterMood={handleRegisterMood}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
