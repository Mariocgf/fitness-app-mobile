import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import BackButton from '@/src/components/common/BackButton';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
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

  useEffect(() => {
    saveHealthConfig({
      injuryIds: selectedInjuryIds,
      medicalConditionIds: selectedConditionIds,
    });
  }, [selectedInjuryIds, selectedConditionIds]);

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={brandColor} />
        <Text className="text-slate-500 dark:text-zinc-400 mt-4">
          Cargando datos de salud...
        </Text>
      </View>
    );
  }

  // ── Pantalla 1: Lesiones ──────────────────────────────────────────
  if (subStep === 0) {
    return (
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <OnboardingHeader
              title="Datos de salud"
              subtitle="Configura tu perfil físico para comenzar"
            />

            <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200 mb-4">
              Lesiones
            </Text>

            <SearchableSelect
              items={injuries}
              selectedIds={selectedInjuryIds}
              onSelectionChange={setSelectedInjuryIds}
              placeholder="Seleccionar - Opcional"
            />
          </Pressable>
        </ScrollView>

        <OnboardingFooter
          brandColor={brandColor}
          onPress={() => setSubStep(1)}
          helperText="Puedes completar o editar estos datos luego."
        />
      </View>
    );
  }

  // ── Pantalla 2: Afecciones Médicas ────────────────────────────────
  return (
    <SwipeBackWrapper onSwipeBack={() => setSubStep(0)}>
    <View className="flex-1">
      <BackButton onPress={() => setSubStep(0)} color={brandColor} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <OnboardingHeader
            title="Datos de salud"
            subtitle="Configura tu perfil físico para comenzar"
          />

          <Text className="text-xl font-semibold text-slate-800 dark:text-zinc-200 mb-4">
            Afecciones médicas
          </Text>

          <SearchableSelect
            items={conditions}
            selectedIds={selectedConditionIds}
            onSelectionChange={setSelectedConditionIds}
            placeholder="Seleccionar - Opcional"
          />
        </Pressable>
      </ScrollView>

      <OnboardingFooter
        brandColor={brandColor}
        onPress={handleSubmit}
        disabled={isSubmitting}
        helperText="Puedes completar o editar estos datos luego."
      />
    </View>
    </SwipeBackWrapper>
  );
}
