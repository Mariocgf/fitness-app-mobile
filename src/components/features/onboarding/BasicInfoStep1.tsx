import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import OnboardingFooter from '@/src/components/common/OnboardingFooter';
import OnboardingHeader from '@/src/components/common/OnboardingHeader';
import ProgressBar from '@/src/components/common/ProgressBar';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';

/** Total de pasos del onboarding básico */
const TOTAL_ONBOARDING_STEPS = 3;

/**
 * Opciones de género: solo Masculino y Femenino (no hay "Otro").
 * El estado "no seleccionado" se logra dejando `gender=''`: el SegmentedControl
 * no resalta ningún segmento mientras el valor no matchee, así no arranca con
 * un género preseleccionado.
 */
const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
];

/** Formatea una fecha a `YYYY-MM-DD` local para el `<input type="date">` de web. */
const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parsea `YYYY-MM-DD` a una Date local. Se construye con los componentes para
 * evitar el corrimiento de día que produce `new Date('YYYY-MM-DD')` (parsea UTC).
 */
const parseDateInputValue = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

interface BasicInfoStep1Props {
  date: Date;
  onDateChange: (date: Date) => void;
  gender: string;
  onGenderChange: (gender: string) => void;
  onContinue: () => void;
}

/**
 * Paso 1 del onboarding: Fecha de nacimiento y Género.
 * Dark-only zinc neutro (onboarding no es módulo → "resto de la UI" en colors.md,
 * mismo criterio que login/Perfil/PrivacyTermsStep). El azul de la maqueta no se
 * traduce a un acento de módulo.
 */
export default function BasicInfoStep1({
  date,
  onDateChange,
  gender,
  onGenderChange,
  onContinue,
}: BasicInfoStep1Props) {
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
    <View className="flex-1 bg-zinc-950">
      {/* Indicador de progreso original (no los círculos numerados de la maqueta) */}
      <ProgressBar currentStep={0} totalSteps={TOTAL_ONBOARDING_STEPS} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-6">
          <OnboardingHeader
            title="Datos básicos"
            subtitle="Necesitamos algunos datos para personalizar tu experiencia."
            centered
          />

          {/* Fecha de nacimiento */}
          <Text className="text-base text-zinc-400 mb-3">Fecha de nacimiento</Text>
          <View className="bg-zinc-900 rounded-3xl p-2 overflow-hidden">
            {/* Web: el DateTimePicker nativo no existe (sin soporte web); se usa
                el date input nativo del navegador, que react-native-web pinta como DOM. */}
            {Platform.OS === 'web' && (
              <input
                type="date"
                value={toDateInputValue(date)}
                max={toDateInputValue(new Date())}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = parseDateInputValue(e.target.value);
                  if (next) onDateChange(next);
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  fontSize: 20,
                  padding: 12,
                  colorScheme: 'dark',
                }}
              />
            )}

            {Platform.OS === 'android' && !showDatePicker && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row justify-between items-center px-3 py-4"
              >
                <Text className="text-xl text-white">
                  {date.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            )}

            {(showDatePicker || Platform.OS === 'ios') && (
              <View className="items-center justify-center" style={{ height: SCREEN_HEIGHT * 0.2 }}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={(e, d) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) onDateChange(d);
                  }}
                  textColor="#ffffff"
                  style={{ width: '100%' }}
                  maximumDate={new Date()}
                />
              </View>
            )}
          </View>

          {/* Género */}
          <Text className="text-base text-zinc-400 mt-8 mb-3">Género</Text>
          <SegmentedControl
            options={GENDER_OPTIONS}
            value={gender}
            onChange={onGenderChange}
            accent="mono"
          />
        </View>
      </ScrollView>

      <OnboardingFooter
        onPress={handleContinue}
        disabled={!gender}
        buttonLabel="Continuar"
        helperText="Usaremos estos datos para calcular recomendaciones más precisas."
        helperIcon={
          <View className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
            <Ionicons name="lock-closed-outline" size={18} color="#a1a1aa" />
          </View>
        }
      />
    </View>
  );
}
