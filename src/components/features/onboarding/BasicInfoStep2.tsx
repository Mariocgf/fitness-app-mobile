import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

import InputCard from '@/src/components/common/InputCard';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import RulerPicker from '@/src/components/common/RulerPicker';

/** Total de pasos del onboarding básico */
const TOTAL_ONBOARDING_STEPS = 3;

interface BasicInfoStep2Props {
  weight: number;
  onWeightChange: (value: number) => void;
  height: number;
  onHeightChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Paso 2 del onboarding: Peso y Altura usando RulerPicker.
 * Diseño según colores de colors.md.
 */
export default function BasicInfoStep2({
  weight,
  onWeightChange,
  height,
  onHeightChange,
  onContinue,
  onBack,
}: BasicInfoStep2Props) {
  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* Barra de progreso - paso 1 */}
      <ProgressBar currentStep={1} totalSteps={TOTAL_ONBOARDING_STEPS} />

      {/* Botón Atrás */}
      <View className="px-6">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center py-2 -ml-1 self-start"
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={Platform.OS === 'ios' ? 28 : 24}
            className="text-slate-950 dark:text-slate-50"
          />
          {Platform.OS === 'ios' && (
            <Text className="text-lg text-slate-900 dark:text-slate-50 -ml-1">
              Atrás
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-2">
          <OnboardingHeader
            title={"Datos\nbásicos"}
            subtitle="Necesitamos algunos datos para personalizar tu experiencia Wellium."
          />

          {/* Card: Peso */}
          <InputCard className="mb-4">
            <RulerPicker
              label="Peso"
              min={30}
              max={200}
              initial={weight}
              unit="kg"
              onValueChange={onWeightChange}
            />
          </InputCard>

          {/* Card: Altura */}
          <InputCard>
            <RulerPicker
              label="Altura"
              min={100}
              max={220}
              initial={height}
              unit="cm"
              onValueChange={onHeightChange}
            />
          </InputCard>
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={onContinue}
        buttonLabel="Continuar"
        helperText="Usaremos estos datos para darte planes más personalizados"
        helperIcon={
          <View className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-800">
            <Ionicons name="sparkles-outline" size={20} className="text-slate-500 dark:text-slate-400" />
          </View>
        }
      />
    </View>
  );
}
