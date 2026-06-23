import { useAuth } from '@clerk/clerk-expo';
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
import TagSelect from '@/src/components/common/TagSelect';
import { useUnsavedChangesGuard } from '@/src/hooks/useUnsavedChangesGuard';
import {
    getDietaryPreferences,
    getFoodAllergies,
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
  /** Vuelve a la lista del módulo tras guardar (la ruta lo cablea a `router.back()`) */
  onBack: () => void;
}

/**
 * Sub-pantalla de configuración de restricciones alimenticias (ruta `/profile/nutrition-dietary`).
 * Reutiliza TagSelect del onboarding de Nutrition. Dark-only `zinc`.
 */
export default function DietaryConfig({ onBack }: DietaryConfigProps) {
  const { getToken } = useAuth();

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

  useUnsavedChangesGuard(
    hasChanges(),
    'Tenés cambios pendientes en tu información nutricional. ¿Querés salir sin guardar?'
  );

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
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#f4f4f5" />
        <Text className="text-zinc-400 mt-4">Cargando datos de nutrición...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-zinc-950">
      {/* Título */}
      <View className="px-8 pt-4 pb-4">
        <Text className="text-2xl font-bold text-white">Restricciones alimenticias</Text>
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
            <Text className="text-lg font-semibold text-zinc-200 mb-2">
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
            <Text className="text-lg font-semibold text-zinc-200 mb-2">
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
          style={isSaving ? { opacity: 0.7 } : undefined}
          className="bg-zinc-50 w-full py-4 rounded-full items-center"
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Text className="text-zinc-950 text-base font-semibold">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
