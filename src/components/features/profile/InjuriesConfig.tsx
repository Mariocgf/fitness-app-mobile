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
import SearchableSelect from '@/src/components/common/SearchableSelect';
import {
  getInjuries,
  getMedicalConditions,
} from '@/src/services/health.service';
import {
  getUserInjuries,
  getUserMedicalConditions,
  updateUserInjuries,
  updateUserMedicalConditions,
  UserHealthItem,
} from '@/src/services/profile.service';
import { Injury, MedicalCondition } from '@/src/types/health';

interface InjuriesConfigProps {
  /** Callback para volver a la pantalla principal del perfil */
  onBack: () => void;
}

/**
 * Sub-pantalla de configuración de lesiones y afecciones médicas.
 * Reutiliza SearchableSelect del onboarding de Health.
 */
export default function InjuriesConfig({ onBack }: InjuriesConfigProps) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [injuriesList, setInjuriesList] = useState<Injury[]>([]);
  const [conditionsList, setConditionsList] = useState<MedicalCondition[]>([]);
  
  const [selectedInjuryIds, setSelectedInjuryIds] = useState<string[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  
  const [initialInjuryIds, setInitialInjuryIds] = useState<string[]>([]);
  const [initialConditionIds, setInitialConditionIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        
        // Cargar catálogos y datos del usuario en paralelo
        const [catInjuries, catConditions, userInjuries, userConditions] = await Promise.all([
          getInjuries(token),
          getMedicalConditions(token),
          getUserInjuries(token),
          getUserMedicalConditions(token),
        ]);

        setInjuriesList(catInjuries);
        setConditionsList(catConditions);

        // Mapear IDs actuales
        const uInjIds = userInjuries.map((i: UserHealthItem) => i.id);
        const uCondIds = userConditions.map((c: UserHealthItem) => c.id);

        setSelectedInjuryIds(uInjIds);
        setInitialInjuryIds(uInjIds);
        
        setSelectedConditionIds(uCondIds);
        setInitialConditionIds(uCondIds);
      } catch (e) {
        console.error('Error cargando datos de salud:', e);
        Alert.alert('Error', 'No se pudieron cargar los datos de salud.');
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
    const injuriesChanged = 
      selectedInjuryIds.length !== initialInjuryIds.length ||
      selectedInjuryIds.some(id => !initialInjuryIds.includes(id));
    
    const conditionsChanged = 
      selectedConditionIds.length !== initialConditionIds.length ||
      selectedConditionIds.some(id => !initialConditionIds.includes(id));

    return injuriesChanged || conditionsChanged;
  };

  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios pendientes en tu información de salud. ¿Deseas salir sin guardar?',
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
        updateUserInjuries(selectedInjuryIds, token),
        updateUserMedicalConditions(selectedConditionIds, token),
      ]);

      // Actualizar estados iniciales
      setInitialInjuryIds([...selectedInjuryIds]);
      setInitialConditionIds([...selectedConditionIds]);

      Alert.alert('Éxito', 'Limitaciones físicas actualizadas correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando limitaciones físicas:', error);
      Alert.alert('Error', 'No se pudieron actualizar las limitaciones físicas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text className="text-slate-500 dark:text-zinc-400 mt-4">
          Cargando datos de salud...
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
          Limitaciones físicas
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
          {/* Lesiones */}
          <View style={{ zIndex: 20 }}>
            <Text className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
              Lesiones
            </Text>
            <SearchableSelect
              items={injuriesList}
              selectedIds={selectedInjuryIds}
              onSelectionChange={setSelectedInjuryIds}
              placeholder="Seleccionar - Opcional"
            />
          </View>

          {/* Afecciones médicas */}
          <View style={{ zIndex: 10, marginTop: 24 }}>
            <Text className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
              Afecciones médicas
            </Text>
            <SearchableSelect
              items={conditionsList}
              selectedIds={selectedConditionIds}
              onSelectionChange={setSelectedConditionIds}
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
