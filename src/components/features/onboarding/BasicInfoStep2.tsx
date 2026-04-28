import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RulerPicker from '@/src/components/common/RulerPicker';

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
          Datos basico
        </Text>
        <Text className="text-lg text-slate-500 dark:text-zinc-400 mb-10">
          Configura tu perfil basico para comenzar
        </Text>

        {/* Peso */}
        <RulerPicker
          label="Peso"
          min={30}
          max={200}
          initial={weight}
          unit="kg"
          onValueChange={onWeightChange}
        />

        {/* Espaciado */}
        <View className="h-8" />

        {/* Altura */}
        <RulerPicker
          label="Altura"
          min={100}
          max={220}
          initial={height}
          unit="cm"
          onValueChange={onHeightChange}
        />
      </View>

      <View className="items-center mb-[34px]">
        <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-8 px-6 leading-5">
          Usaremos estos datos para darte planes mas personalizados
        </Text>

        <TouchableOpacity
          className="w-full bg-[#00c2e0] py-5 rounded-2xl items-center shadow-md"
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
