import { BodyMeasurementFormView } from '@/src/components/features/health/BodyMeasurementFormView';
import { useBodyMeasurements } from '@/src/hooks/useBodyMeasurements';
import { BodyMeasurementPayload } from '@/src/types/health';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeasurementsScreen() {
  const router = useRouter();
  // autoLoad: false → no cargar historial; esta pantalla solo hace POST
  const { submit, isSubmitting, submitError } = useBodyMeasurements({ autoLoad: false });

  const handleSubmit = useCallback(
    async (payload: BodyMeasurementPayload) => {
      const result = await submit(payload);
      // Si el submit fue exitoso, volver al dashboard (que refrescará por useFocusEffect)
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
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <BodyMeasurementFormView
        isSubmitting={isSubmitting}
        submitError={submitError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
