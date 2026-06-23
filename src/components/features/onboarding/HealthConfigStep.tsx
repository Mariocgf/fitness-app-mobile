import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

import BackButton from '@/src/components/common/BackButton';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import SearchableSelect from '@/src/components/common/SearchableSelect';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { useModuleConfigStorage } from '@/src/hooks/use-module-config-storage';
import {
    getInjuries,
    getMedicalConditions,
    submitHealthProfile,
} from '@/src/services/health.service';
import { Injury, MedicalCondition } from '@/src/types/health';

interface HealthConfigStepProps {
  brandColor: string;
  onComplete: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

/** Acento del módulo Salud (colors.md → dark = rose-400). */
const HEALTH_ACCENT = '#fb7185';

export default function HealthConfigStep({
  brandColor,
  onComplete,
  isSubmitting,
  setIsSubmitting,
}: HealthConfigStepProps) {
  const { getToken } = useAuth();
  const { saveHealthConfig, loadHealthConfig } = useModuleConfigStorage();

  const [subStep, setSubStep] = useState(0);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInjuryIds, setSelectedInjuryIds] = useState<string[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        const [injuriesData, conditionsData] = await Promise.all([
          getInjuries(token),
          getMedicalConditions(token),
        ]);
        setInjuries(injuriesData);
        setConditions(conditionsData);
        const draft = await loadHealthConfig();
        if (draft) {
          if (draft.injuryIds?.length) setSelectedInjuryIds(draft.injuryIds);
          if (draft.medicalConditionIds?.length)
            setSelectedConditionIds(draft.medicalConditionIds);
        }
      } catch (e) {
        console.error('Error inicializando Health config:', e);
        alert('No se pudieron cargar los datos de salud.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await submitHealthProfile(
        { injuryIds: selectedInjuryIds, medicalConditionIds: selectedConditionIds },
        token
      );
      onComplete();
    } catch (error) {
      console.error('Error enviando perfil de salud:', error);
      alert('Hubo un error al guardar los datos de salud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const helperFooter = (
    <View className="w-11 h-11 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
      <Ionicons name="lock-closed-outline" size={20} color={HEALTH_ACCENT} />
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={HEALTH_ACCENT} />
        <Text className="text-zinc-400 mt-4">
          Cargando datos de salud...
        </Text>
      </View>
    );
  }

  // ── Paso 1: Lesiones ──────────────────────────────────────────────
  if (subStep === 0) {
    return (
      <View className="flex-1">
        <StatusBar style="light" />
        <ProgressBar currentStep={0} totalSteps={2} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <OnboardingHeader
              title="Datos de salud"
              subtitle="Cuéntanos tus lesiones que debamos considerar."
              centered
            />

            <SearchableSelect
              items={injuries}
              selectedIds={selectedInjuryIds}
              onSelectionChange={setSelectedInjuryIds}
              placeholder="Buscar lesión"
              cardTitle="¿Tienes alguna lesión?"
            />
          </Pressable>
        </ScrollView>

        <OnboardingFooter
          onPress={() => {
            saveHealthConfig({ injuryIds: selectedInjuryIds, medicalConditionIds: selectedConditionIds });
            setSubStep(1);
          }}
          buttonLabel="Continuar"
          helperText="Esta información es confidencial y solo se usa para personalizar tu planes."
          helperIcon={helperFooter}
        />
      </View>
    );
  }

  // ── Paso 2: Afecciones médicas ────────────────────────────────────
  return (
    <SwipeBackWrapper onSwipeBack={() => setSubStep(0)}>
      <View className="flex-1">
        <StatusBar style="light" />
        <ProgressBar currentStep={1} totalSteps={2} />
        <BackButton onPress={() => setSubStep(0)} color={brandColor} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <OnboardingHeader
              title="Datos de salud"
              subtitle="¿Tienes alguna afección médica que debamos considerar?"
              centered
            />

            <SearchableSelect
              items={conditions}
              selectedIds={selectedConditionIds}
              onSelectionChange={setSelectedConditionIds}
              placeholder="Buscar afección"
              cardTitle="¿Tienes alguna afección?"
            />
          </Pressable>
        </ScrollView>

        <OnboardingFooter
          onPress={handleSubmit}
          disabled={isSubmitting}
          buttonLabel="Continuar"
          helperText="Esta información es confidencial y solo se usa para personalizar tu planes."
          helperIcon={helperFooter}
        />
      </View>
    </SwipeBackWrapper>
  );
}
