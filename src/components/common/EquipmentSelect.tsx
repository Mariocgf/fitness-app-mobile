import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    DeviceEventEmitter,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Equipment, EquipmentSelection } from '@/src/types/fitness';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface EquipmentSelectProps {
  /** Lista completa de equipamientos del backend */
  equipments: Equipment[];
  /** Equipamiento seleccionado con cantidad (para excluirlo de los resultados) */
  selectedEquipment: EquipmentSelection[];
  /** Callback al agregar un equipamiento a la selección */
  onSelectionChange: (items: EquipmentSelection[]) => void;
  /** Placeholder del input de búsqueda */
  placeholder?: string;
}

/**
 * Buscador de equipamiento (dark-only `zinc`): input con lupa a la izquierda y
 * dropdown absoluto de resultados. Solo busca y agrega; la lista de
 * seleccionados con cantidad la renderiza `EquipmentSelectedList` en el
 * consumidor (onboarding Fitness / perfil).
 */
export default function EquipmentSelect({
  equipments,
  selectedEquipment,
  onSelectionChange,
  placeholder = 'Buscar equipamiento',
}: EquipmentSelectProps) {
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const componentId = useRef(Math.random().toString()).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const safeEquipments = Array.isArray(equipments) ? equipments : [];
  const safeSelected = Array.isArray(selectedEquipment) ? selectedEquipment : [];

  const selectedIds = useMemo(() => {
    return safeSelected
      .map((e) => (e.id ? String(e.id).trim().toLowerCase() : ''))
      .filter((id) => id !== '');
  }, [safeSelected]);

  /**
   * Equipamientos filtrados: excluye seleccionados y filtra por query.
   */
  const filteredItems = useMemo(() => {
    const available = safeEquipments.filter((eq) => {
      if (!eq.id) return true;
      const eqId = String(eq.id).trim().toLowerCase();
      return !selectedIds.includes(eqId);
    });

    if (!query.trim()) return available;

    const normalizedQuery = query.toLowerCase().trim();
    return available.filter((eq) =>
      eq.name.toLowerCase().includes(normalizedQuery)
    );
  }, [safeEquipments, selectedIds, query]);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener('closeDropdowns', () => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
        return;
      }
      setIsOpen(false);
      inputRef.current?.blur();
    });

    const sub2 = DeviceEventEmitter.addListener('closeOtherDropdowns', (id) => {
      if (id !== componentId) {
        setIsOpen(false);
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [isKeyboardVisible, isOpen]);

  const handleSelect = (item: Equipment) => {
    onSelectionChange([...safeSelected, { id: item.id, qty: 1 }]);
    setQuery('');
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    DeviceEventEmitter.emit('closeOtherDropdowns', componentId);
    setIsOpen(true);
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <View className="z-50">
      {/* Input con búsqueda */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        className={`flex-row items-center border rounded-2xl px-4 bg-zinc-900 ${
          isOpen ? 'border-zinc-600' : 'border-zinc-800'
        }`}
        style={{ height: 52 }}
      >
        <Ionicons name="search" size={20} className="text-zinc-500" />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor="#71717a"
          className="flex-1 text-base text-white ml-3"
          style={{ height: 52, paddingVertical: 0 }}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </TouchableOpacity>

      {/* Dropdown de resultados (posicionado de forma absoluta) */}
      {isOpen && filteredItems.length > 0 && (
        <View
          className="absolute left-0 right-0 border border-zinc-800 rounded-2xl bg-zinc-900 overflow-hidden z-50"
          style={{
            top: 56, // justo debajo del input (52 alto + 4 margen)
            maxHeight: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item)}
                activeOpacity={0.6}
                className="flex-row items-center px-4 py-3 border-b border-zinc-800"
              >
                <Text className="flex-1 text-base text-white">{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
