import { MoodFormView } from "@/src/components/features/health/wellness/mood/MoodFormView";
import { useMoodHistory } from "@/src/hooks/useMoodHistory";
import { AddMoodLogDto } from "@/src/types/wellness";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pantalla de "Registrar ánimo" (sub-ruta del tab Salud). Contenedor liviano:
 * solo registra (autoLoad=false → no carga el historial) y, al guardar, vuelve.
 * La pantalla de Ánimo refresca en focus, así que el nuevo registro aparece solo.
 */
export default function MoodNewScreen() {
  const router = useRouter();
  const { submit, isSubmitting, submitError } = useMoodHistory({
    autoLoad: false,
  });

  const handleSubmit = useCallback(
    async (payload: AddMoodLogDto) => {
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
      <MoodFormView
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
