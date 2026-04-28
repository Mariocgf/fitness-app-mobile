import React from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Goal } from '@/src/types/goal';

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
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="px-8"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 pt-2">
        {/* Botón Atrás nativo */}
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center mb-4 -ml-1 self-start py-2"
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={Platform.OS === 'ios' ? 28 : 24}
            className="text-slate-900 dark:text-white"
          />
          {Platform.OS === 'ios' && (
            <Text className="text-lg text-slate-900 dark:text-white -ml-1">
              Atrás
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-[34px] font-bold text-slate-900 dark:text-white">
          Tu objetivo
        </Text>
        <Text className="text-lg text-slate-500 dark:text-zinc-400 mb-10">
          ¿Qué quieres lograr?
        </Text>

        {/* Grid 2×2 de opciones */}
        <View className="flex-row flex-wrap justify-between">
          {isLoading ? (
            <View className="w-full py-20 items-center justify-center">
              <Text className="text-slate-500 dark:text-zinc-400">Cargando objetivos...</Text>
            </View>
          ) : (
            goals.map((option) => {
              const isSelected = goal === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onGoalChange(option.id)}
                  activeOpacity={0.7}
                  className={`w-[48%] mb-4 py-6 px-4 rounded-2xl items-center justify-center border-2 ${
                    isSelected
                      ? 'border-[#00c2e0] bg-cyan-50 dark:bg-cyan-950'
                      : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}
                  style={
                    !isSelected
                      ? {
                          // Sombra sutil para las tarjetas no seleccionadas
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.06,
                          shadowRadius: 4,
                          elevation: 1,
                        }
                      : {
                          // Sombra cyan para la seleccionada
                          shadowColor: '#00c2e0',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 3,
                        }
                  }
                >
                  <Text
                    className={`text-base font-semibold text-center ${
                      isSelected
                        ? 'text-[#00c2e0]'
                        : 'text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    {option.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      <View className="items-center mb-[34px]">
        <TouchableOpacity
          className="w-full bg-[#00c2e0] py-5 rounded-2xl items-center shadow-md"
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">
            Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
