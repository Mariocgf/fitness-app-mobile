import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '@/src/components/ui/feedback';

import SearchableSelect from '@/src/components/common/SearchableSelect';
import { useUnsavedChangesGuard } from '@/src/hooks/useUnsavedChangesGuard';
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
  /** Vuelve a la lista del módulo tras guardar (la ruta lo cablea a `router.back()`) */
  onBack: () => void;
}

export default function InjuriesConfig({ onBack }: InjuriesConfigProps) {
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
        logger.error('Error cargando lesiones:', e);
        toast.error('No se pudieron cargar los datos de salud.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const hasChanges = () =>
    selectedInjuryIds.length !== initialInjuryIds.length ||
    selectedInjuryIds.some((id) => !initialInjuryIds.includes(id));

  useUnsavedChangesGuard(
    hasChanges(),
    'Tus cambios en lesiones no se guardaron. ¿Querés salir de todas formas?'
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateUserInjuries(selectedInjuryIds, token);
      setInitialInjuryIds([...selectedInjuryIds]);
      toast.success('Lesiones actualizadas correctamente.');
      onBack();
    } catch (error) {
      logger.error('Error guardando lesiones:', error);
      toast.error('No se pudieron actualizar las lesiones.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#a1a1aa" />
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
        />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-4 pt-3">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-zinc-50"
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-zinc-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

/** Vista de configuración de afecciones médicas */
export function ConditionsConfig({ onBack }: InjuriesConfigProps) {
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
        logger.error('Error cargando afecciones:', e);
        toast.error('No se pudieron cargar los datos de salud.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const hasChangesConditions = () =>
    selectedConditionIds.length !== initialConditionIds.length ||
    selectedConditionIds.some((id) => !initialConditionIds.includes(id));

  useUnsavedChangesGuard(
    hasChangesConditions(),
    'Tus cambios en afecciones médicas no se guardaron. ¿Querés salir de todas formas?'
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateUserMedicalConditions(selectedConditionIds, token);
      setInitialConditionIds([...selectedConditionIds]);
      toast.success('Afecciones médicas actualizadas correctamente.');
      onBack();
    } catch (error) {
      logger.error('Error guardando afecciones:', error);
      toast.error('No se pudieron actualizar las afecciones médicas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#a1a1aa" />
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
        />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-4 pt-3">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          className="w-full py-4 rounded-full items-center bg-zinc-50"
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          <Text className="text-base font-semibold text-zinc-950">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
