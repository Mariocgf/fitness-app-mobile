import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { MeasurementComparePicker } from "@/src/components/features/health/MeasurementComparePicker";
import { MeasurementComparisonSheet } from "@/src/components/features/health/MeasurementComparisonSheet";
import { MeasurementDetailView } from "@/src/components/features/health/MeasurementDetailView";
import { useMeasurementComparison } from "@/src/hooks/useMeasurementComparison";
import {
  deleteBodyMeasurement,
  getBodyMeasurementById,
} from "@/src/services/health.service";
import { bumpHealthData } from "@/src/store/health-sync";
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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = useCallback(() => {
    if (!id) return;

    Alert.alert(
      "Eliminar registro",
      "¿Querés eliminar esta medición corporal? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const token = await getToken();
              await deleteBodyMeasurement(id, token);
              bumpHealthData();
              router.back();
            } catch {
              setIsDeleting(false);
              Alert.alert(
                "No se pudo eliminar",
                "La medición ya no existe o no pudimos completar la operación. Intentá de nuevo.",
              );
            }
          },
        },
      ],
    );
  }, [id, getToken, router]);

  if (isFetching && !measurement) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#fb7185" />
      </View>
    );
  }

  if (!measurement) return null;

  return (
    <>
      <MeasurementDetailView
        measurement={measurement}
        isDeleting={isDeleting}
        onBack={() => router.back()}
        onPressCompare={() => setPickerVisible(true)}
        onDelete={handleDelete}
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
