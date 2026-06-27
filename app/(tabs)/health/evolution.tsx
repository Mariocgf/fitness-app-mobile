import { BodyEvolutionView } from '@/src/components/features/health/BodyEvolutionView';
import { useBodyEvolutionDashboard } from '@/src/hooks/useBodyEvolutionDashboard';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BodyEvolutionScreen() {
  const router = useRouter();
  const { dashboard, isLoading, error, refresh } = useBodyEvolutionDashboard();

  // Evita el fetch doble: el hook ya carga en mount; solo refrescar en focuses posteriores
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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <BodyEvolutionView
        dashboard={dashboard}
        isLoading={isLoading}
        error={error}
        onBack={handleBack}
        onRefresh={refresh}
      />
    </SafeAreaView>
  );
}
