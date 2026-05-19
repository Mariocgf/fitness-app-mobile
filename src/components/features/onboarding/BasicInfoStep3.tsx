import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import InputCard from '@/src/components/common/InputCard';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { Goal } from '@/src/types/goal';

/** Total de pasos del onboarding básico */
const TOTAL_ONBOARDING_STEPS = 3;

interface BasicInfoStep3Props {
  goal: string;
  onGoalChange: (goal: string) => void;
  onContinue: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  goals: Goal[];
  isLoading: boolean;
}

/**
 * Paso 3 del onboarding: Selección de objetivo (grid 2×2).
 * Diseño según imagen de referencia y colores de colors.md.
 */
export default function BasicInfoStep3({
  goal,
  onGoalChange,
  onContinue,
  onBack,
  isSubmitting,
  goals,
  isLoading,
}: BasicInfoStep3Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleContinue = () => {
    if (!goal) {
      alert('Por favor selecciona tu objetivo.');
      return;
    }
    onContinue();
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* StatusBar con estilo adecuado */}
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Barra de progreso - paso 2 (último del onboarding básico) */}
      <ProgressBar currentStep={2} totalSteps={TOTAL_ONBOARDING_STEPS} />

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
            color={isDark ? '#f8fafc' : '#0f172a'}
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

          {/* Card: Objetivo */}
          <InputCard>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              ¿Qué quieres lograr?
            </Text>

            {isLoading ? (
              <View className="py-10 items-center justify-center">
                <Text className="text-slate-500 dark:text-slate-400">
                  Cargando objetivos...
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {goals.map((option) => {
                  const isSelected = goal === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => onGoalChange(option.id)}
                      activeOpacity={0.7}
                      className={`w-[48%] mb-3 py-4 px-3 rounded-xl items-center justify-center border ${
                        isSelected
                          ? 'border-zinc-950 dark:border-zinc-50 bg-zinc-950 dark:bg-zinc-50'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium text-center ${
                          isSelected
                            ? 'text-white dark:text-slate-900'
                            : 'text-slate-900 dark:text-slate-50'
                        }`}
                      >
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </InputCard>
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={handleContinue}
        disabled={!goal || isSubmitting}
        buttonLabel="Continuar"
        helperText="Usaremos estos datos para darte planes más personalizados"
        helperIcon={
          <View className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-800">
            <Ionicons name="sparkles-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </View>
        }
      />
    </View>
  );
}
