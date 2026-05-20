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
    useColorScheme,
    View,
} from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface TagSelectItem {
  id: string;
  name: string;
}

interface TagSelectProps {
  /** Lista completa de items disponibles */
  items: TagSelectItem[];
  /** IDs de los items seleccionados */
  selectedIds: string[];
  /** Callback al cambiar la selección */
  onSelectionChange: (ids: string[]) => void;
  /** Placeholder del input de búsqueda */
  placeholder?: string;
  /** Si false, solo muestra el buscador sin los tags seleccionados */
  showSelectedList?: boolean;
}

/**
 * Componente de selección con búsqueda y tags.
 * - Sin FlatList (evita VirtualizedLists anidados).
 * - Se cierra SOLO cuando se toca afuera (mediante el emisor global).
 * - No se cierra al presionar Enter ni al tocar afuera si el teclado estaba abierto.
 */
export default function TagSelect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Seleccionar - Opcional',
  showSelectedList = true,
}: TagSelectProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark'; // needed for placeholderTextColor (native TextInput prop)
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const componentId = useRef(Math.random().toString()).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const filteredItems = useMemo(() => {
    const available = safeItems.filter(
      (item) => !safeSelectedIds.includes(item.id)
    );
    if (!query.trim()) return available;
    const q = query.toLowerCase().trim();
    return available.filter((item) => item.name.toLowerCase().includes(q));
  }, [safeItems, safeSelectedIds, query]);

  const selectedItems = useMemo(
    () => safeItems.filter((item) => safeSelectedIds.includes(item.id)),
    [safeItems, safeSelectedIds]
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

  const handleSelect = (item: TagSelectItem) => {
    onSelectionChange([...safeSelectedIds, item.id]);
    setQuery('');
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleRemove = (id: string) => {
    onSelectionChange(safeSelectedIds.filter((sid) => sid !== id));
  };

  const handleFocus = () => {
    DeviceEventEmitter.emit('closeOtherDropdowns', componentId);
    setIsOpen(true);
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!isOpen) setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <View>
      <View style={{ zIndex: 50 }}>
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
                closeDropdown();
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

        {isOpen && filteredItems.length > 0 && (
          <View
            className="absolute left-0 right-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            style={{
              top: 54,
              maxHeight: 200,
              zIndex: 100,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50"
                >
                  <Text
                    className="flex-1 text-base text-slate-900 dark:text-zinc-200"
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {showSelectedList && selectedItems.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {selectedItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center self-start px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700"
            >
              <Text className="text-sm font-medium text-slate-900 dark:text-zinc-200 mr-2">
                {item.name}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  className="text-slate-500 dark:text-zinc-400"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

