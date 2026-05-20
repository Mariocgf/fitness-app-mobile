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

import { HealthItem } from '@/src/types/health';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#2dd4bf',    
  Medium: '#fb923c', 
  High: '#f87171',   
};

interface SearchableSelectProps {
  items: HealthItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  /** Título del encabezado de la card (opcional) */
  cardTitle?: string;
  /** Subtítulo del encabezado de la card (opcional) */
  cardSubtitle?: string;
  /** Nombre del ícono Ionicons para la card (opcional) */
  cardIconName?: string;
  /** Etiqueta para la sección de seleccionados (singular/plural automático) */
  selectedLabel?: string;
}

export default function SearchableSelect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Seleccionar - Opcional',
  cardTitle,
  cardSubtitle,
  cardIconName,
  selectedLabel = 'Seleccionadas',
}: SearchableSelectProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark'; // needed for placeholderTextColor and TextInput style (native props)
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const componentId = useRef(Math.random().toString()).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const filteredItems = useMemo(() => {
    const available = safeItems.filter((item) => !safeSelectedIds.includes(item.id));
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
      if (id !== componentId) setIsOpen(false);
    });
    return () => { sub1.remove(); sub2.remove(); };
  }, [isKeyboardVisible, isOpen]);

  const handleSelect = (item: HealthItem) => {
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
    <View className="gap-3">
      {/* Card principal: encabezado + buscador */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        {/* Encabezado opcional */}
        {cardTitle && (
          <View className="flex-row items-center gap-3 mb-4">
            {cardIconName && (
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
                <Ionicons
                  name={cardIconName as any}
                  size={20}
                  className="text-slate-500 dark:text-slate-400"
                />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {cardTitle}
              </Text>
              {cardSubtitle && (
                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {cardSubtitle}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Input de búsqueda */}
        <View style={{ zIndex: 50 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            className={`flex-row items-center border rounded-xl px-4 bg-slate-50 dark:bg-slate-950 ${
              isOpen
                ? 'border-zinc-400 dark:border-zinc-500'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
            style={{ height: 50 }}
          >
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
              style={{
                flex: 1,
                height: 50,
                paddingVertical: 0,
                fontSize: 16,
                color: isDark ? '#ffffff' : '#0f172a',
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <TouchableOpacity
              onPress={() => isOpen ? closeDropdown() : inputRef.current?.focus()}
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
                {filteredItems.map((item) => {
                  const severityColor = SEVERITY_COLORS[item.severity] || '#94a3b8';
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.6}
                      className="flex-row items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50"
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: severityColor,
                          marginRight: 10,
                        }}
                      />
                      <Text className="flex-1 text-[15px] text-slate-900 dark:text-zinc-200">
                        {item.name} - {item.severity}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Card de seleccionados */}
      {selectedItems.length > 0 && (
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 gap-2">
          {/* Header: "Seleccionadas (N)" + "Borrar todas" */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {selectedLabel} ({selectedItems.length})
            </Text>
            <TouchableOpacity onPress={() => onSelectionChange([])}>
              <Text style={{ fontSize: 14, color: '#3b82f6', fontWeight: '500' }}>
                Borrar todas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chips con borde */}
          {selectedItems.map((item) => {
            const dotColor = SEVERITY_COLORS[item.severity] || '#94a3b8';
            return (
              <View
                key={item.id}
                className="flex-row items-center px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: dotColor,
                    marginRight: 10,
                  }}
                />
                <Text className="flex-1 text-[15px] text-slate-900 dark:text-slate-200">
                  {item.name} - {item.severity}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    className="text-slate-500 dark:text-slate-400"
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
