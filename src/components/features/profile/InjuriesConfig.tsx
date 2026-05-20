import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  onBack: () => void;
  onRegisterBackHandler?: (fn: (() => void) | null) => void;
}

export default function InjuriesConfig({ onBack, onRegisterBackHandler }: InjuriesConfigProps) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [injuriesList, setInjuriesList] = useState<Injury[]>([]);
  const [selectedInjuryIds, setSelectedInjuryIds] = useState<string[]>([]);
  const [initialInjuryIds, setInitialInjuryIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        const [catInjuries, userInjuries] = await Promise.all([
          getInjuries(token),
          getUserInjuries(token),
        ]);
        setInjuriesList(catInjuries);
        const uInjIds = userInjuries.map((i: UserHealthItem) => i.id);
        setSelectedInjuryIds(uInjIds);
        setInitialInjuryIds(uInjIds);
      } catch (e) {
        console.error('Error cargando lesiones:', e);
        Alert.alert('Error', 'No se pudieron cargar los datos de salud.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const hasChanges = () =>
    selectedInjuryIds.length !== initialInjuryIds.length ||
    selectedInjuryIds.some((id) => !initialInjuryIds.includes(id));

  const backHandlerRef = useRef<() => void>(() => {});
  backHandlerRef.current = () => {
    if (hasChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tus cambios en lesiones no se guardaron. ¿Deseas salir de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir sin guardar', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

  useEffect(() => {
    onRegisterBackHandler?.(() => backHandlerRef.current());
    return () => onRegisterBackHandler?.(null);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateUserInjuries(selectedInjuryIds, token);
      setInitialInjuryIds([...selectedInjuryIds]);
      Alert.alert('Éxito', 'Lesiones actualizadas correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando lesiones:', error);
      Alert.alert('Error', 'No se pudieron actualizar las lesiones.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#64748b" />
      </View>
    );
  }

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <SearchableSelect
          items={injuriesList}
          selectedIds={selectedInjuryIds}
          onSelectionChange={setSelectedInjuryIds}
          placeholder="Buscar lesión"
          cardTitle="Lesiones"
          cardSubtitle="¿Tenés alguna lesión activa?"
          cardIconName="bandage-outline"
          selectedLabel="Lesiones"
        />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-4 pt-3">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-slate-950 dark:bg-slate-100"
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-white dark:text-slate-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

/** Vista de configuración de afecciones médicas */
export function ConditionsConfig({ onBack, onRegisterBackHandler }: InjuriesConfigProps) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [conditionsList, setConditionsList] = useState<MedicalCondition[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [initialConditionIds, setInitialConditionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        const [catConditions, userConditions] = await Promise.all([
          getMedicalConditions(token),
          getUserMedicalConditions(token),
        ]);
        setConditionsList(catConditions);
        const uCondIds = userConditions.map((c: UserHealthItem) => c.id);
        setSelectedConditionIds(uCondIds);
        setInitialConditionIds(uCondIds);
      } catch (e) {
        console.error('Error cargando afecciones:', e);
        Alert.alert('Error', 'No se pudieron cargar los datos de salud.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const hasChangesConditions = () =>
    selectedConditionIds.length !== initialConditionIds.length ||
    selectedConditionIds.some((id) => !initialConditionIds.includes(id));

  const backHandlerRef = useRef<() => void>(() => {});
  backHandlerRef.current = () => {
    if (hasChangesConditions()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tus cambios en afecciones médicas no se guardaron. ¿Deseas salir de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir sin guardar', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

  useEffect(() => {
    onRegisterBackHandler?.(() => backHandlerRef.current());
    return () => onRegisterBackHandler?.(null);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateUserMedicalConditions(selectedConditionIds, token);
      setInitialConditionIds([...selectedConditionIds]);
      Alert.alert('Éxito', 'Afecciones médicas actualizadas correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando afecciones:', error);
      Alert.alert('Error', 'No se pudieron actualizar las afecciones médicas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#64748b" />
      </View>
    );
  }

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <SearchableSelect
          items={conditionsList}
          selectedIds={selectedConditionIds}
          onSelectionChange={setSelectedConditionIds}
          placeholder="Buscar afección"
          cardTitle="Afecciones médicas"
          cardSubtitle="¿Tenés alguna condición médica?"
          cardIconName="medkit-outline"
          selectedLabel="Afecciones"
        />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-4 pt-3">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-slate-950 dark:bg-slate-100"
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-white dark:text-slate-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
