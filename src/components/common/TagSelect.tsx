import { Ionicons } from '@expo/vector-icons';
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
  const isDark = colorScheme === 'dark';
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
              color={isDark ? '#a1a1aa' : '#9ca3af'}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {isOpen && filteredItems.length > 0 && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 54,
              maxHeight: 200,
              zIndex: 100,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? '#3f3f46' : '#e5e7eb',
              backgroundColor: isDark ? '#27272a' : '#ffffff',
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark
                      ? 'rgba(63,63,70,0.5)'
                      : '#f3f4f6',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: isDark ? '#e4e4e7' : '#1e293b',
                    }}
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
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}
        >
          {selectedItems.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? '#52525b' : '#d1d5db',
                backgroundColor: isDark ? '#3f3f46' : '#f9fafb',
              }}
            >
              <Text
                style={{
                  color: isDark ? '#e4e4e7' : '#1e293b',
                  fontSize: 14,
                  fontWeight: '500',
                  marginRight: 8,
                }}
              >
                {item.name}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={isDark ? '#a1a1aa' : '#64748b'}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

