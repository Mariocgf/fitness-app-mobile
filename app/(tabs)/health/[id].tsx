import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { MeasurementDetailView } from "@/src/components/features/health/MeasurementDetailView";
import { getBodyMeasurementById } from "@/src/services/health.service";
import { BodyMeasurementDto } from "@/src/types/health";

export default function MeasurementDetailScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  // Snapshot del param como estado inicial para renderizado inmediato mientras llega el fetch
  const [measurement, setMeasurement] = useState<BodyMeasurementDto | null>(
    data ? (JSON.parse(data) as BodyMeasurementDto) : null,
  );
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    const fetchDetail = async () => {
      try {
        const token = await getToken();
        const result = await getBodyMeasurementById(id, token);
        setMeasurement(result);
      } catch {
        // Si hay snapshot del param, la UI ya tiene algo para mostrar; no bloquear
      } finally {
        setIsFetching(false);
      }
    };
    fetchDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isFetching && !measurement) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (!measurement) return null;

  return (
    <MeasurementDetailView
      measurement={measurement}
      onBack={() => router.back()}
    />
  );
}
