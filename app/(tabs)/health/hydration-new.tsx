import { HydrationFormView } from "@/src/components/features/health/wellness/hydration/HydrationFormView";
import { useHydrationHistory } from "@/src/hooks/useHydrationHistory";
import { AddHydrationLogDto } from "@/src/types/wellness";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pantalla de "Registrar hidratación" (sub-ruta del tab Salud). Contenedor liviano:
 * solo registra (autoLoad=false → no carga el historial) y, al guardar, vuelve.
 * La pantalla de Hidratación refresca en focus, así que el nuevo registro aparece solo.
 */
export default function HydrationNewScreen() {
  const router = useRouter();
  const { submit, isSubmitting, submitError } = useHydrationHistory({
    autoLoad: false,
  });

  const handleSubmit = useCallback(
    async (payload: AddHydrationLogDto) => {
      const result = await submit(payload);
      if (result != null) {
        router.back();
      }
    },
    [submit, router],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <HydrationFormView
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
