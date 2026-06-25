import { ClinicalReadingFormView } from "@/src/components/features/health/clinical/ClinicalReadingFormView";
import { useClinicalReadings } from "@/src/hooks/useClinicalReadings";
import { ClinicalReadingPayload } from "@/src/types/clinical";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClinicalReadingNewScreen() {
  const router = useRouter();
  // autoLoad: false → esta pantalla solo registra; no necesita el historial
  const { submit, isSubmitting, submitError } = useClinicalReadings({
    autoLoad: false,
  });

  const handleSubmit = useCallback(
    async (payload: ClinicalReadingPayload) => {
      const result = await submit(payload);
      // Si guardó bien, volver (al dashboard o a Lecturas clínicas, que refrescan en focus)
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
      <ClinicalReadingFormView
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
