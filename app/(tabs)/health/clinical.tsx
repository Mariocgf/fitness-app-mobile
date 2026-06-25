import { ClinicalDataView } from "@/src/components/features/health/clinical/ClinicalDataView";
import { useClinicalProfile } from "@/src/hooks/useClinicalProfile";
import { ClinicalProfilePayload } from "@/src/types/clinical";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClinicalDataScreen() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    isSubmitting,
    submitError,
    updateProfile,
    setAiConsent,
  } = useClinicalProfile();

  const handleSave = useCallback(
    async (payload: ClinicalProfilePayload) => {
      const result = await updateProfile(payload);
      // Si guardó bien, volver al dashboard (que refresca por useFocusEffect)
      if (result != null) {
        router.back();
      }
    },
    [updateProfile, router],
  );

  const handleToggleAi = useCallback(
    (enabled: boolean) => {
      setAiConsent(enabled);
    },
    [setAiConsent],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ClinicalDataView
        profile={profile}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSave={handleSave}
        onToggleAiConsent={handleToggleAi}
      />
    </SafeAreaView>
  );
}
