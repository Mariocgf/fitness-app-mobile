import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { confirm, toast } from "@/src/components/ui/feedback";
import { SleepDetailView } from "@/src/components/features/health/wellness/sleep/SleepDetailView";
import {
  deleteSleepLog,
  getSleepLogById,
} from "@/src/services/wellness.service";
import { bumpWellnessData } from "@/src/store/wellness-sync";
import { SleepLogDto } from "@/src/types/wellness";

/**
 * Pantalla de detalle de un registro de sueño (sub-ruta del tab Salud).
 * Recibe un snapshot del registro por param (`data`) para render inmediato y
 * refresca por `id` contra el backend. Permite eliminar con confirmación; al
 * volver, la pantalla de Sueño refresca en focus y la lista se actualiza sola.
 */
export default function SleepDetailScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  // Snapshot del param como estado inicial para renderizado inmediato mientras llega el fetch.
  const [log, setLog] = useState<SleepLogDto | null>(
    data ? (JSON.parse(data) as SleepLogDto) : null,
  );
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    const fetchDetail = async () => {
      try {
        const token = await getToken();
        const result = await getSleepLogById(id, token);
        setLog(result);
      } catch {
        // Si hay snapshot del param, la UI ya tiene algo para mostrar; no bloquear.
      } finally {
        setIsFetching(false);
      }
    };
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: "Eliminar registro",
      message:
        "¿Querés eliminar este registro de sueño? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      destructive: true,
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      await deleteSleepLog(id, token);
      // Mutación: avanza la versión para que Bienestar/Sueño refresquen al volver.
      bumpWellnessData();
      router.back();
    } catch {
      setIsDeleting(false);
      toast.error("Revisá tu conexión e intentá de nuevo.", {
        title: "No se pudo eliminar",
      });
    }
  }, [id, getToken, router]);

  if (isFetching && !log) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#fb7185" />
      </View>
    );
  }

  if (!log) return null;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <SleepDetailView
        log={log}
        isDeleting={isDeleting}
        onBack={() => router.back()}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
