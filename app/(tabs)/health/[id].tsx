import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { MeasurementComparePicker } from "@/src/components/features/health/MeasurementComparePicker";
import { MeasurementComparisonSheet } from "@/src/components/features/health/MeasurementComparisonSheet";
import { MeasurementDetailView } from "@/src/components/features/health/MeasurementDetailView";
import { useMeasurementComparison } from "@/src/hooks/useMeasurementComparison";
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

  // Estado del picker — controla el render condicional del sheet (no montar cerrado)
  const [pickerVisible, setPickerVisible] = useState(false);

  const { comparison, isLoadingTarget, targetError, selectTarget, reset } =
    useMeasurementComparison(measurement);

  // Sheet de resultado visible mientras carga o cuando ya hay comparación
  const comparisonSheetVisible = isLoadingTarget || comparison != null || targetError != null;

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
    <>
      <MeasurementDetailView
        measurement={measurement}
        onBack={() => router.back()}
        onPressCompare={() => setPickerVisible(true)}
      />

      {/* Picker: montado condicionalmente para no ejecutar hooks pesados cuando está cerrado */}
      {pickerVisible && (
        <MeasurementComparePicker
          excludeId={measurement.id}
          onSelect={(targetId) => {
            setPickerVisible(false);
            selectTarget(targetId);
          }}
          onClose={() => setPickerVisible(false)}
        />
      )}

      {/* Sheet de resultado: montado solo cuando hay actividad de comparación */}
      {comparisonSheetVisible && (
        <MeasurementComparisonSheet
          comparison={comparison}
          isLoading={isLoadingTarget}
          error={targetError}
          onClose={reset}
        />
      )}
    </>
  );
}
