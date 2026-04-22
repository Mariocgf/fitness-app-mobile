import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, useColorScheme, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { updateBasicInfo } from '../src/services/user.service';
import { FullPageLoader } from '@/src/components/common/FullPageLoader';

export default function OnboardingScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [date, setDate] = useState(new Date(2004, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!gender) {
      alert('Por favor selecciona tu género.');
      return;
    }

    if (!user) {
      alert('Error: Usuario no encontrado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      
      const payload = {
        birthDay: date.toISOString().split('T')[0],
        gender,
      };

      await updateBasicInfo(user.id, payload, token);
      
      // Recargamos el usuario por si el backend actualizó los metadatos de Clerk
      await user.reload();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error guardando onboarding:', error);
      alert('Hubo un error al guardar los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        className="px-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-8">
          <Text className="text-[34px] font-bold text-slate-900 dark:text-white mb-8">
            Datos basico
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
                  {date.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })}
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
                    if (d) setDate(d);
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
              style={{ height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.18 : 64 }}
              className={`rounded-2xl justify-center overflow-hidden ${Platform.OS === 'android' ? 'border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800' : ''}`}
            >
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => setGender(itemValue)}
                mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
                style={{ 
                  color: isDark ? '#FFFFFF' : '#0f172a',
                  height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.18 : 64,
                  backgroundColor: 'transparent',
                }}
                itemStyle={{ height: SCREEN_HEIGHT * 0.18 }}
                dropdownIconColor={isDark ? '#FFFFFF' : '#0f172a'}
              >
                <Picker.Item label="No seleccionado" value="" color={isDark ? '#666' : '#999'} />
                <Picker.Item label="Masculino" value="male" color={isDark ? '#FFF' : '#000'} />
                <Picker.Item label="Femenino" value="female" color={isDark ? '#FFF' : '#000'} />
              </Picker>
            </View>
          </View>
        </View>

        <View className="items-center mb-[34px]">
          <Text className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-8 px-6 leading-5">
            Usaremos estos datos para darte planes mas personalizados
          </Text>

          <TouchableOpacity
            className={`w-full bg-[#00c2e0] py-5 rounded-2xl items-center shadow-md ${isSubmitting ? 'opacity-70' : ''}`}
            onPress={handleContinue}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              {isSubmitting ? 'Guardando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
