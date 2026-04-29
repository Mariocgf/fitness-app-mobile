import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/src/components/common/BackButton';
import TagSelect from '@/src/components/common/TagSelect';
import {
  getFoodAllergies,
  getDietaryPreferences,
} from '@/src/services/nutrition.service';
import {
  getUserFoodAllergies,
  getUserTypeOfDiets,
  updateUserFoodAllergies,
  updateUserTypeOfDiets,
  UserNutritionItem,
} from '@/src/services/profile.service';
import { NutritionItem } from '@/src/types/nutrition';

interface DietaryConfigProps {
  /** Callback para volver a la pantalla principal del perfil */
  onBack: () => void;
}

/**
 * Sub-pantalla de configuración de restricciones alimenticias.
 * Reutiliza TagSelect del onboarding de Nutrition.
 */
export default function DietaryConfig({ onBack }: DietaryConfigProps) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [allergiesList, setAllergiesList] = useState<NutritionItem[]>([]);
  const [dietaryPreferencesList, setDietaryPreferencesList] = useState<NutritionItem[]>([]);
  
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<string[]>([]);
  const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
  
  const [initialAllergyIds, setInitialAllergyIds] = useState<string[]>([]);
  const [initialDietIds, setInitialDietIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();

        // Cargar catálogos y datos del usuario en paralelo
        const [catAllergies, catDiets, userAllergies, userDiets] = await Promise.all([
          getFoodAllergies(token),
          getDietaryPreferences(token),
          getUserFoodAllergies(token),
          getUserTypeOfDiets(token),
        ]);

        setAllergiesList(Array.isArray(catAllergies) ? catAllergies : []);
        setDietaryPreferencesList(Array.isArray(catDiets) ? catDiets : []);

        // Mapear IDs actuales
        const uAllergyIds = userAllergies.map((a: UserNutritionItem) => a.id);
        const uDietIds = userDiets.map((d: UserNutritionItem) => d.id);

        setSelectedAllergyIds(uAllergyIds);
        setInitialAllergyIds(uAllergyIds);
        
        setSelectedDietIds(uDietIds);
        setInitialDietIds(uDietIds);
      } catch (e) {
        console.error('Error cargando datos de nutrición:', e);
        Alert.alert('Error', 'No se pudieron cargar los datos de nutrición.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  /**
   * Detecta si hay cambios reales comparando arrays de IDs (ignora orden)
   */
  const hasChanges = () => {
    const allergiesChanged = 
      selectedAllergyIds.length !== initialAllergyIds.length ||
      selectedAllergyIds.some(id => !initialAllergyIds.includes(id));
    
    const dietsChanged = 
      selectedDietIds.length !== initialDietIds.length ||
      selectedDietIds.some(id => !initialDietIds.includes(id));

    return allergiesChanged || dietsChanged;
  };

  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios pendientes en tu información nutricional. ¿Deseas salir sin guardar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir sin guardar', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();

      // Guardar ambos en paralelo
      await Promise.all([
        updateUserFoodAllergies(selectedAllergyIds, token),
        updateUserTypeOfDiets(selectedDietIds, token),
      ]);

      // Actualizar estados iniciales
      setInitialAllergyIds([...selectedAllergyIds]);
      setInitialDietIds([...selectedDietIds]);

      Alert.alert('Éxito', 'Restricciones alimenticias actualizadas correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando restricciones:', error);
      Alert.alert('Error', 'No se pudieron actualizar las restricciones.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text className="text-slate-500 dark:text-zinc-400 mt-4">
          Cargando datos de nutrición...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-zinc-950">
      <BackButton onPress={handleBack} color="#06b6d4" label="Volver" />

      {/* Título */}
      <View className="px-8 pt-2 pb-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Restricciones alimenticias
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          {/* Alergias alimentarias */}
          <View style={{ zIndex: 20 }}>
            <Text className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
              Alergias alimentarias
            </Text>
            <TagSelect
              items={allergiesList}
              selectedIds={selectedAllergyIds}
              onSelectionChange={setSelectedAllergyIds}
              placeholder="Seleccionar - Opcional"
            />
          </View>

          {/* Estilo de dieta */}
          <View style={{ zIndex: 10, marginTop: 24 }}>
            <Text className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
              Tipo de dieta
            </Text>
            <TagSelect
              items={dietaryPreferencesList}
              selectedIds={selectedDietIds}
              onSelectionChange={setSelectedDietIds}
              placeholder="Seleccionar - Opcional"
            />
          </View>
        </Pressable>
      </ScrollView>

      {/* Botón Guardar */}
      <View className="px-8 pb-32 pt-4">
        <TouchableOpacity
          style={[
            { backgroundColor: '#06b6d4' }, // cyan-500
            isSaving && { opacity: 0.7 },
          ]}
          className="w-full py-4 rounded-2xl items-center shadow-md"
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
