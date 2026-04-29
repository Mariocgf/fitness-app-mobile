import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/src/components/common/BackButton';
import EquipmentSelect from '@/src/components/common/EquipmentSelect';
import { getEquipments } from '@/src/services/fitness.service';
import {
  getUserEquipment,
  updateUserEquipment,
  UserEquipmentItem,
} from '@/src/services/profile.service';
import { Equipment, EquipmentSelection } from '@/src/types/fitness';

interface EquipmentConfigProps {
  /** Callback para volver a la pantalla principal del perfil */
  onBack: () => void;
}

/**
 * Sub-pantalla de configuración de equipamiento.
 * Reutiliza el componente EquipmentSelect del onboarding de Fitness.
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
          setInitialEquipment(mapped); // Guardar copia inicial para comparar
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

  /**
   * Compara la lista actual con la inicial para ver si hay cambios reales.
   * Ignora el orden.
   */
  const hasChanges = () => {
    if (selectedEquipment.length !== initialEquipment.length) return true;

    // Crear un mapa para búsqueda rápida por ID
    const initialMap = new Map(initialEquipment.map(item => [item.id, item.qty]));

    for (const item of selectedEquipment) {
      const initialQty = initialMap.get(item.id);
      // Si el ID no existe en la lista inicial o la cantidad cambió
      if (initialQty === undefined || initialQty !== item.qty) {
        return true;
      }
    }

    return false;
  };

  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios en tu lista de equipamiento. ¿Deseas salir sin guardar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Salir sin guardar', 
            style: 'destructive', 
            onPress: onBack 
          },
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
      await updateUserEquipment(
        {
          equipmentItems: selectedEquipment.map((e) => ({
            equipmentId: e.id,
            quantity: e.qty,
          })),
        },
        token
      );
      
      // Actualizar el estado inicial después de guardar con éxito
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text className="text-slate-500 dark:text-zinc-400 mt-4">
          Cargando equipamiento...
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
          Equipamientos
        </Text>
      </View>

      {/* Contenido — EquipmentSelect reutilizado */}
      <Pressable
        style={{ flex: 1, paddingHorizontal: 32 }}
        onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
      >
        <Text className="text-base font-semibold text-slate-800 dark:text-zinc-200 mb-2">
          Equipamiento disponible
        </Text>

        <View className="flex-1 z-50">
          <EquipmentSelect
            equipments={equipmentList}
            selectedEquipment={selectedEquipment}
            onSelectionChange={setSelectedEquipment}
            placeholder="Seleccionar - Opcional"
          />
        </View>
      </Pressable>

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
