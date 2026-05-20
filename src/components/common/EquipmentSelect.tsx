import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    DeviceEventEmitter,
    Keyboard,
    LayoutAnimation,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    useColorScheme,
    View,
} from 'react-native';

import { Equipment, EquipmentSelection } from '@/src/types/fitness';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

// Habilitar LayoutAnimation en Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EquipmentSelectProps {
  /** Lista completa de equipamientos del backend */
  equipments: Equipment[];
  /** Equipamiento seleccionado con cantidad */
  selectedEquipment: EquipmentSelection[];
  /** Callback al cambiar la selección */
  onSelectionChange: (items: EquipmentSelection[]) => void;
  /** Placeholder del input de búsqueda */
  placeholder?: string;
  /** Si false, solo muestra el buscador sin la lista de seleccionados */
  showSelectedList?: boolean;
}

/**
 * Componente de selección de equipamiento con búsqueda, control de cantidad
 * (+/−) y animación de salida al remover items.
 */
export default function EquipmentSelect({
  equipments,
  selectedEquipment,
  onSelectionChange,
  placeholder = 'Seleccionar - Opcional',
  showSelectedList = true,
}: EquipmentSelectProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark'; // needed for placeholderTextColor (native TextInput prop)
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

  /**
   * Items seleccionados con datos completos (nombre + qty).
   */
  const selectedWithDetails = useMemo(
    () =>
      safeSelected.map((sel) => ({
        ...sel,
        name: sel.name || safeEquipments.find((eq) => eq.id === sel.id)?.name || '',
      })),
    [safeSelected, safeEquipments]
  );

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

  const handleIncrement = (id: string) => {
    onSelectionChange(
      safeSelected.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    const item = safeSelected.find((e) => e.id === id);
    if (!item) return;

    if (item.qty <= 1) {
      // Animar la salida y remover
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onSelectionChange(safeSelected.filter((e) => e.id !== id));
    } else {
      onSelectionChange(
        safeSelected.map((e) =>
          e.id === id ? { ...e, qty: e.qty - 1 } : e
        )
      );
    }
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
    <View style={showSelectedList ? { flex: 1 } : undefined} className="z-50">
      {/* Input con búsqueda */}
      <View className="z-50">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          className={`flex-row items-center border rounded-xl px-4 ${
            isOpen
              ? 'border-slate-400 dark:border-slate-500'
              : 'border-slate-200 dark:border-slate-800'
          } bg-white dark:bg-slate-900`}
          style={{ height: 50 }}
        >
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
            className="flex-1 text-base text-slate-900 dark:text-white"
            style={{ height: 50, paddingVertical: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => {
              Keyboard.dismiss();
            }}
          />
          <TouchableOpacity
            onPress={() => {
              if (isOpen) {
                setIsOpen(false);
                inputRef.current?.blur();
                Keyboard.dismiss();
              } else {
                inputRef.current?.focus();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              className="text-zinc-400 dark:text-zinc-500"
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Dropdown de resultados (Posicionado de forma absoluta) */}
        {isOpen && filteredItems.length > 0 && (
          <View
            className="absolute left-0 right-0 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden z-50"
            style={{
              top: 54, // just below the input (50 height + 4 margin)
              maxHeight: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800/50"
                >
                  <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Lista de equipamiento seleccionado con controles de cantidad */}
      <View className="flex-1 z-0 mt-3">
        {showSelectedList && selectedWithDetails.length > 0 && (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20, gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {selectedWithDetails.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between border border-gray-200 dark:border-zinc-700 rounded-xl px-4 bg-white dark:bg-zinc-800"
                style={{ height: 52 }}
              >
                <Text className="text-base text-slate-800 dark:text-zinc-200 flex-1">
                  {item.name}
                </Text>

                {/* Controles de cantidad */}
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => handleDecrement(item.id)}
                    activeOpacity={0.6}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-zinc-600 items-center justify-center bg-gray-50 dark:bg-zinc-700"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      className="text-slate-500 dark:text-zinc-300"
                    />
                  </TouchableOpacity>

                  <Text className="text-base font-semibold text-slate-800 dark:text-zinc-200 min-w-[20px] text-center">
                    {item.qty}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleIncrement(item.id)}
                    activeOpacity={0.6}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-zinc-600 items-center justify-center bg-gray-50 dark:bg-zinc-700"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      className="text-slate-500 dark:text-zinc-300"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
