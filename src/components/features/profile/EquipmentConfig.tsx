import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { getEquipments } from '@/src/services/fitness.service';
import {
    getUserEquipment,
    updateUserEquipment,
    UserEquipmentItem,
} from '@/src/services/profile.service';
import { Equipment, EquipmentSelection } from '@/src/types/fitness';

interface EquipmentConfigProps {
  onBack: () => void;
  /** Registra el handler de back del componente en el padre */
  onRegisterBackHandler?: (fn: (() => void) | null) => void;
}

/**
 * Sub-pantalla de configuración de equipamiento.
 * Reutiliza EquipmentSelect del onboarding con el nuevo diseño visual.
 */
export default function EquipmentConfig({ onBack, onRegisterBackHandler }: EquipmentConfigProps) {
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

  const backHandlerRef = useRef<() => void>(() => {});
  backHandlerRef.current = () => {
    if (hasChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tus cambios en equipamiento no se guardaron. ¿Deseas salir de todas formas?',
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

  const handleIncrement = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item))
    );
  };

  const handleDecrement = (id: string) => {
    const item = selectedEquipment.find((e) => e.id === id);
    if (!item) return;
    if (item.qty <= 1) {
      setSelectedEquipment((prev) => prev.filter((e) => e.id !== id));
    } else {
      setSelectedEquipment((prev) =>
        prev.map((e) => (e.id === id ? { ...e, qty: e.qty - 1 } : e))
      );
    }
  };

  const handleRemove = (id: string) => {
    setSelectedEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#64748b" />
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
          className="bg-white dark:bg-slate-800 rounded-2xl p-4"
          style={{ gap: 12 }}
        >
          {/* Título descriptivo */}
          <Pressable
            className="flex-row items-center gap-3"
            onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
          >
            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
              <Ionicons name="barbell-outline" size={20} className="text-slate-500 dark:text-slate-400" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
                Equipamiento
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
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
            showSelectedList={false}
          />
        </View>
      </View>

      {/* Lista de seleccionados — scrolleable */}
      {selectedWithDetails.length > 0 && (
        <View style={{ flex: 1, marginTop: 16 }}>
          {/* Encabezado con contador y "Borrar todas" */}
          <View className="flex-row items-center justify-between px-5 mb-2">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Seleccionadas ({selectedWithDetails.length})
            </Text>
            <TouchableOpacity onPress={() => setSelectedEquipment([])}>
              <Text className="text-sm font-medium text-red-400">Borrar todas</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => DeviceEventEmitter.emit('closeDropdowns')}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 100,
              gap: 8,
            }}
          >
            {selectedWithDetails.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center h-[60px] bg-white dark:bg-slate-800 rounded-2xl px-4 border border-slate-200 dark:border-slate-700"
              >
                <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">
                  {item.name}
                </Text>

                {/* Controles qty con borde */}
                <View className="flex-row items-center border border-slate-200 dark:border-slate-600 rounded-2xl overflow-hidden mr-4">
                  <TouchableOpacity
                    onPress={() => handleDecrement(item.id)}
                    activeOpacity={0.6}
                    className="w-9 h-9 items-center justify-center"
                  >
                    <Text className="text-xl font-semibold text-slate-500 dark:text-slate-400">-</Text>
                  </TouchableOpacity>

                  <Text className="text-base font-semibold text-slate-900 dark:text-slate-50 w-8 text-center">
                    {item.qty}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleIncrement(item.id)}
                    activeOpacity={0.6}
                    className="w-9 h-9 items-center justify-center"
                  >
                    <Text className="text-xl font-semibold text-slate-500 dark:text-slate-400">+</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón eliminar */}
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} className="text-slate-400 dark:text-slate-500" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Botón Guardar fijo abajo */}
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 8 }}
        className="px-4 pt-3 bg-white dark:bg-slate-950"
      >
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
    </View>
  );
}
