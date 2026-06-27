import { HydrationView } from "@/src/components/features/health/wellness/hydration/HydrationView";
import { useHydrationHistory } from "@/src/hooks/useHydrationHistory";
import { getWellnessDataVersion } from "@/src/store/wellness-sync";
import { HydrationLogDto } from "@/src/types/wellness";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Pantalla de detalle de Hidratación (sub-ruta del tab Salud). Contenedor liviano:
 * consume el historial paginado de hidratación y delega el render a `HydrationView`.
 * "Nuevo registro" navega al formulario `hydration-new` y cada fila del historial
 * abre `hydration-detail`; al volver, el focus refresca si hubo mutación.
 */
export default function HydrationScreen() {
  const router = useRouter();
  const {
    logs,
    lastLog,
    todayMl,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useHydrationHistory();

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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRegister = useCallback(() => {
    router.push("/(tabs)/health/hydration-new");
  }, [router]);

  // Abre el detalle del registro. Pasa un snapshot por param para render inmediato
  // mientras la pantalla de detalle refresca por id contra el backend.
  const handleSelectLog = useCallback(
    (log: HydrationLogDto) => {
      router.push({
        pathname: "/(tabs)/health/hydration-detail",
        params: { id: log.id, data: JSON.stringify(log) },
      });
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <HydrationView
        logs={logs}
        lastLog={lastLog}
        todayMl={todayMl}
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
