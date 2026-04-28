import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
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

interface BasicInfoStep1Props {
  date: Date;
  onDateChange: (date: Date) => void;
  gender: string;
  onGenderChange: (gender: string) => void;
  onContinue: () => void;
}

/**
 * Paso 1 del onboarding: Fecha de nacimiento y Género.
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
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="px-8"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 pt-8">
        <Text className="text-[34px] font-bold text-slate-900 dark:text-white">
          Datos basico
        </Text>
        <Text className="text-lg text-slate-500 dark:text-zinc-400 mb-8">
          Configura tu perfil basico para comenzar
        </Text>

        {/* Fecha de nacimiento */}
        <View className="mb-8">
          <Text className="text-xl text-slate-800 dark:text-zinc-200 mb-4">
            Ingresa tu fecha de nacimiento
          </Text>

          {Platform.OS === 'android' && !showDatePicker && (
            <TouchableOpacity
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 py-4 rounded-2xl items-center mb-4"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-lg text-slate-800 dark:text-white">
                {date.toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          )}

          {(showDatePicker || Platform.OS === 'ios') && (
            <View
              style={{ height: SCREEN_HEIGHT * 0.22 }}
              className="items-center justify-center"
            >
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(e, d) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (d) onDateChange(d);
                }}
                textColor={isDark ? '#FFFFFF' : '#0f172a'}
                style={{ width: '100%', height: SCREEN_HEIGHT * 0.22 }}
                maximumDate={new Date()}
              />
            </View>
          )}
        </View>

        {/* Género */}
        <View className="mb-10">
          <Text className="text-xl text-slate-800 dark:text-zinc-200 mb-4">
            Selecciona tu genero
          </Text>

          <View
            style={{
              height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.18 : 64,
            }}
            className={`rounded-2xl justify-center overflow-hidden ${
              Platform.OS === 'android'
                ? 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                : ''
            }`}
          >
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => onGenderChange(itemValue)}
              mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
              style={{
                color: isDark ? '#FFFFFF' : '#0f172a',
                height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.18 : 64,
                backgroundColor: 'transparent',
              }}
              itemStyle={{ height: SCREEN_HEIGHT * 0.18 }}
              dropdownIconColor={isDark ? '#FFFFFF' : '#0f172a'}
            >
              <Picker.Item
                label="No seleccionado"
                value=""
                color={isDark ? '#666' : '#999'}
              />
              <Picker.Item
                label="Masculino"
                value="male"
                color={isDark ? '#FFF' : '#000'}
              />
              <Picker.Item
                label="Femenino"
                value="female"
                color={isDark ? '#FFF' : '#000'}
              />
            </Picker>
          </View>
        </View>
      </View>

      <View className="items-center mb-[34px]">
        <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-8 px-6 leading-5">
          Usaremos estos datos para darte planes mas personalizados
        </Text>

        <TouchableOpacity
          className="w-full bg-[#00c2e0] py-5 rounded-2xl items-center shadow-md"
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
