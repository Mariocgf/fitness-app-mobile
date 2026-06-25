import { ClinicalReadingsView } from "@/src/components/features/health/clinical/ClinicalReadingsView";
import { useClinicalReadings } from "@/src/hooks/useClinicalReadings";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClinicalReadingsScreen() {
  const router = useRouter();
  const {
    readings,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useClinicalReadings();

  // Evita el fetch doble: el hook ya carga en mount; solo refrescar en focuses posteriores
  // (ej: al volver de registrar una lectura nueva).
  const didInitialFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didInitialFocusRef.current) {
        didInitialFocusRef.current = true;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const handleRegister = useCallback(() => {
    router.push("/health/clinical-reading-new" as any);
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ClinicalReadingsView
        readings={readings}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        onBack={handleBack}
        onRegister={handleRegister}
        onLoadMore={loadMore}
        onRefresh={refresh}
      />
    </SafeAreaView>
  );
}
