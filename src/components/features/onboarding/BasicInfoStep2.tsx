import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import WheelPicker from '@/src/components/common/WheelPicker';

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
 * Paso 2 del onboarding: Peso y Altura con wheel nativo.
 * Dark-only zinc neutro (onboarding no es módulo → "resto de la UI" en colors.md,
 * mismo criterio que el paso 1 y login/Perfil). El azul de la maqueta no se
 * traduce a un acento de módulo. El back se resuelve por swipe (SwipeBackWrapper
 * en onboarding.tsx), como en la maqueta que no dibuja botón de retroceso.
 */
export default function BasicInfoStep2({
  weight,
  onWeightChange,
  height,
  onHeightChange,
  onContinue,
}: BasicInfoStep2Props) {
  const { height: screenHeight } = useWindowDimensions();
  /**
   * Alto del wheel calculado para que las dos cards (Peso + Altura) entren en
   * pantalla sin scroll: se descuenta el chrome aproximado (progress, header,
   * footer, paddings) y se reparte el resto entre los dos wheels. Acotado para
   * que no quede ni minúsculo ni gigante.
   */
  const wheelHeight = Math.max(96, Math.min(160, (screenHeight - 580) / 2));

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Indicador de progreso original (no los círculos numerados de la maqueta) */}
      <ProgressBar currentStep={1} totalSteps={TOTAL_ONBOARDING_STEPS} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-3">
          <OnboardingHeader
            title="Datos físicos"
            subtitle="Necesitamos esta información para calcular tus necesidades energéticas y personalizar tus planes."
            centered
          />

          {/* Card: Peso */}
          <View className="bg-zinc-900 rounded-3xl p-4 mb-3">
            <WheelPicker
              label="Peso"
              min={30}
              max={200}
              value={weight}
              unit="kg"
              onChange={onWeightChange}
              wheelHeight={wheelHeight}
            />
          </View>

          {/* Card: Altura */}
          <View className="bg-zinc-900 rounded-3xl p-4">
            <WheelPicker
              label="Altura"
              min={100}
              max={220}
              value={height}
              unit="cm"
              onChange={onHeightChange}
              wheelHeight={wheelHeight}
            />
          </View>
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={onContinue}
        buttonLabel="Continuar"
        helperText="Podrás modificar estos datos más adelante."
        helperIcon={
          <View className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
            <Ionicons name="information-circle-outline" size={20} color="#a1a1aa" />
          </View>
        }
      />
    </View>
  );
}
