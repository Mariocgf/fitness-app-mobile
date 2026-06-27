import { SleepView } from "@/src/components/features/health/wellness/sleep/SleepView";
import { useSleepHistory } from "@/src/hooks/useSleepHistory";
import { getWellnessDataVersion } from "@/src/store/wellness-sync";
import { SleepLogDto } from "@/src/types/wellness";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pantalla de detalle de Sueño (sub-ruta del tab Salud). Contenedor liviano:
 * consume el historial paginado de sueño y delega el render a `SleepView`.
 * "Nuevo registro" navega al formulario `sleep-new`; al volver, el focus refresca.
 */
export default function SleepScreen() {
  const router = useRouter();
  const {
    logs,
    lastLog,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useSleepHistory();

  // Solo refresca si hubo una mutación real (registrar/eliminar) desde la última
  // carga: volver del detalle (solo lectura) no debe llamar a la API al pedo.
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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRegister = useCallback(() => {
    router.push("/(tabs)/health/sleep-new");
  }, [router]);

  const handleSelectLog = useCallback(
    (log: SleepLogDto) => {
      router.push({
        pathname: "/(tabs)/health/sleep-detail",
        params: { id: log.id, data: JSON.stringify(log) },
      });
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <SleepView
        logs={logs}
        lastLog={lastLog}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        onBack={handleBack}
        onLoadMore={loadMore}
        onRefresh={refresh}
        onRegister={handleRegister}
        onSelectLog={handleSelectLog}
      />
    </SafeAreaView>
  );
}
