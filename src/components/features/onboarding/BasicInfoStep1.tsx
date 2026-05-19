import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    useColorScheme,
    useWindowDimensions,
    View,
} from 'react-native';

import InputCard from '@/src/components/common/InputCard';
import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';

/** Total de pasos del onboarding básico */
const TOTAL_ONBOARDING_STEPS = 3;

interface BasicInfoStep1Props {
  date: Date;
  onDateChange: (date: Date) => void;
  gender: string;
  onGenderChange: (gender: string) => void;
  onContinue: () => void;
}

/** Opciones de género disponibles */
const GENDER_OPTIONS = [
  { label: 'No seleccionado', value: '' },
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
];

/**
 * Paso 1 del onboarding: Fecha de nacimiento y Género.
 * Diseño según imagen de referencia y colores de colors.md.
 */
export default function BasicInfoStep1({
  date,
  onDateChange,
  gender,
  onGenderChange,
  onContinue,
}: BasicInfoStep1Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

  const handleContinue = () => {
    if (!gender) {
      alert('Por favor selecciona tu género.');
      return;
    }
    onContinue();
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* StatusBar con estilo adecuado */}
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Barra de progreso */}
      <ProgressBar currentStep={0} totalSteps={TOTAL_ONBOARDING_STEPS} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4">
          <OnboardingHeader
            title={"Datos\nbásicos"}
            subtitle="Necesitamos algunos datos para personalizar tu experiencia Wellium."
          />

          {/* Card: Fecha de nacimiento */}
          <InputCard className="mb-4">
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Fecha de nacimiento
            </Text>

            {Platform.OS === 'android' && !showDatePicker && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row justify-between items-center"
              >
                <Text className="text-xl text-slate-900 dark:text-slate-50">
                  {date.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={24} className="text-slate-400 dark:text-slate-500" />
              </TouchableOpacity>
            )}

            {(showDatePicker || Platform.OS === 'ios') && (
              <View className="items-center justify-center" style={{ height: SCREEN_HEIGHT * 0.18 }}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={(e, d) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) onDateChange(d);
                  }}
                  textColor={isDark ? '#f8fafc' : '#0f172a'}
                  style={{ width: '100%' }}
                  maximumDate={new Date()}
                />
              </View>
            )}
          </InputCard>

          {/* Card: Género */}
          <InputCard>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Género
            </Text>
            <View
              style={{
                height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.15 : 56,
              }}
              className="justify-center overflow-hidden"
            >
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => onGenderChange(itemValue)}
                mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
                style={{
                  color: isDark ? '#f8fafc' : '#0f172a',
                  height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.15 : 56,
                  backgroundColor: 'transparent',
                }}
                itemStyle={{ height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.15 : 56 }}
                dropdownIconColor={isDark ? '#f8fafc' : '#0f172a'}
              >
                <Picker.Item
                  label="No seleccionado"
                  value=""
                  color={isDark ? '#94a3b8' : '#94a3b8'}
                />
                <Picker.Item
                  label="Masculino"
                  value="male"
                  color={isDark ? '#f8fafc' : '#0f172a'}
                />
                <Picker.Item
                  label="Femenino"
                  value="female"
                  color={isDark ? '#f8fafc' : '#0f172a'}
                />
              </Picker>
            </View>
          </InputCard>
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={handleContinue}
        disabled={!gender}
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
