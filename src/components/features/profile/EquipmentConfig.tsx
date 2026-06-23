import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

import EquipmentSelect from '@/src/components/common/EquipmentSelect';
import EquipmentSelectedList from '@/src/components/common/EquipmentSelectedList';
import { useUnsavedChangesGuard } from '@/src/hooks/useUnsavedChangesGuard';
import { getEquipments } from '@/src/services/fitness.service';
import {
    getUserEquipment,
    updateUserEquipment,
    UserEquipmentItem,
} from '@/src/services/profile.service';
import { Equipment, EquipmentSelection } from '@/src/types/fitness';

interface EquipmentConfigProps {
  /** Vuelve a la lista del módulo tras guardar (la ruta lo cablea a `router.back()`) */
  onBack: () => void;
}

/**
 * Sub-pantalla de configuración de equipamiento (ruta `/profile/fitness-equipment`).
 * Reutiliza EquipmentSelect del onboarding con el nuevo diseño visual.
 */
export default function EquipmentConfig({ onBack }: EquipmentConfigProps) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSelection[]>([]);
  const [initialEquipment, setInitialEquipment] = useState<EquipmentSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        const [allEquipments, userEquipments] = await Promise.all([
          getEquipments(token),
          getUserEquipment(token),
        ]);
        setEquipmentList(Array.isArray(allEquipments) ? allEquipments : []);
        if (Array.isArray(userEquipments)) {
          const mapped: EquipmentSelection[] = userEquipments.map(
            (item: UserEquipmentItem) => ({
              id: item.id,
              name: item.name,
              qty: item.quantity || 1,
            })
          );
          setSelectedEquipment(mapped);
          setInitialEquipment(mapped);
        }
      } catch (e) {
        console.error('Error cargando equipamiento:', e);
        Alert.alert('Error', 'No se pudo cargar el equipamiento.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  /** Items seleccionados enriquecidos con nombre completo */
  const selectedWithDetails = useMemo(
    () =>
      selectedEquipment.map((sel) => ({
        ...sel,
        name: sel.name || equipmentList.find((eq) => eq.id === sel.id)?.name || '',
      })),
    [selectedEquipment, equipmentList]
  );

  const hasChanges = () => {
    if (selectedEquipment.length !== initialEquipment.length) return true;
    const initialMap = new Map(initialEquipment.map((item) => [item.id, item.qty]));
    for (const item of selectedEquipment) {
      const initialQty = initialMap.get(item.id);
      if (initialQty === undefined || initialQty !== item.qty) return true;
    }
    return false;
  };

  useUnsavedChangesGuard(
    hasChanges(),
    'Tus cambios en equipamiento no se guardaron. ¿Querés salir de todas formas?'
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateUserEquipment(
        {
          equipmentItems: selectedEquipment.map((e) => ({
            equipmentId: e.id,
            quantity: e.qty,
          })),
        },
        token
      );
      setInitialEquipment([...selectedEquipment]);
      Alert.alert('Éxito', 'Equipamiento actualizado correctamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      console.error('Error guardando equipamiento:', error);
      Alert.alert('Error', 'No se pudo actualizar el equipamiento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeQty = (id: string, qty: number) => {
    setSelectedEquipment((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const handleRemove = (id: string) => {
    setSelectedEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#a1a1aa" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Backdrop invisible que cierra el dropdown al tocar fuera */}
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
      />
      {/* Header fijo: título + buscador */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
        <View
          className="bg-zinc-900 rounded-2xl p-4"
          style={{ gap: 12 }}
        >
          {/* Título descriptivo */}
          <Pressable
            className="flex-row items-center gap-3"
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
              <Ionicons name="barbell-outline" size={20} className="text-zinc-400" />
            </View>
            <View>
              <Text className="text-base font-bold text-white">
                Equipamiento
              </Text>
              <Text className="text-sm text-zinc-400">
                ¿Con qué materiales cuentas?
              </Text>
            </View>
          </Pressable>

          {/* Buscador — solo el input, sin lista de seleccionados interna */}
          <EquipmentSelect
            equipments={equipmentList}
            selectedEquipment={selectedEquipment}
            onSelectionChange={setSelectedEquipment}
            placeholder="Buscar equipamiento"
          />
        </View>
      </View>

      {/* Lista de seleccionados — scrolleable */}
      {selectedWithDetails.length > 0 && (
        <ScrollView
          style={{ flex: 1, marginTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => DeviceEventEmitter.emit('closeDropdowns')}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
          }}
        >
          <EquipmentSelectedList
            items={selectedWithDetails.map((item) => ({
              id: String(item.id),
              name: item.name,
              qty: item.qty,
            }))}
            onChangeQty={handleChangeQty}
            onRemove={handleRemove}
            onClearAll={() => setSelectedEquipment([])}
            accent="lime"
          />
        </ScrollView>
      )}

      {/* Botón Guardar fijo abajo */}
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 8 }}
        className="px-4 pt-3 bg-zinc-950"
      >
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
    </View>
  );
}
