import { ClinicalDataView } from "@/src/components/features/health/clinical/ClinicalDataView";
import { useClinicalProfile } from "@/src/hooks/useClinicalProfile";
import { useUserMedicalConditions } from "@/src/hooks/useUserMedicalConditions";
import { bumpHealthData } from "@/src/store/health-sync";
import { AiConsentPayload, ClinicalProfilePayload } from "@/src/types/clinical";
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
  const {
    conditions,
    isLoading: conditionsLoading,
    toggleAiConsent: toggleConditionAi,
  } = useUserMedicalConditions();

  const handleSave = useCallback(
    async (payload: ClinicalProfilePayload) => {
      const result = await updateProfile(payload);
      // Si guardó bien, marcar mutación y volver: el dashboard refresca por versión
      if (result != null) {
        bumpHealthData();
        router.back();
      }
    },
    [updateProfile, router],
  );

  const handleSetAiConsent = useCallback(
    (payload: AiConsentPayload) => {
      setAiConsent(payload);
    },
    [setAiConsent],
  );

  const handleToggleConditionAi = useCallback(
    (conditionId: string, enabled: boolean) => {
      toggleConditionAi(conditionId, enabled);
    },
    [toggleConditionAi],
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
        conditions={conditions}
        conditionsLoading={conditionsLoading}
        onBack={handleBack}
        onSave={handleSave}
        onSetAiConsent={handleSetAiConsent}
        onToggleConditionAi={handleToggleConditionAi}
      />
    </SafeAreaView>
  );
}
