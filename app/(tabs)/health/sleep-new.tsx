import { SleepFormView } from "@/src/components/features/health/wellness/sleep/SleepFormView";
import { useSleepHistory } from "@/src/hooks/useSleepHistory";
import { AddSleepLogDto } from "@/src/types/wellness";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pantalla de "Registrar sueño" (sub-ruta del tab Salud). Contenedor liviano:
 * solo registra (autoLoad=false → no carga el historial) y, al guardar, vuelve.
 * La pantalla de Sueño refresca en focus, así que el nuevo registro aparece solo.
 */
export default function SleepNewScreen() {
  const router = useRouter();
  const { submit, isSubmitting, submitError } = useSleepHistory({
    autoLoad: false,
  });

  const handleSubmit = useCallback(
    async (payload: AddSleepLogDto) => {
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
      <SleepFormView
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
