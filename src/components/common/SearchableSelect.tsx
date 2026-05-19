import { HealthItem } from '@/src/types/health';
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
  const isDark = colorScheme === 'dark';
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

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View className="gap-3">
      {/* Card principal: encabezado + buscador */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor,
        }}
      >
        {/* Encabezado opcional */}
        {cardTitle && (
          <View className="flex-row items-center gap-3 mb-4">
            {cardIconName && (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={cardIconName as any}
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </View>
            )}
            <View className="flex-1">
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                }}
              >
                {cardTitle}
              </Text>
              {cardSubtitle && (
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#94a3b8' : '#64748b',
                    marginTop: 2,
                  }}
                >
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 50,
              borderColor: isOpen
                ? isDark ? '#71717a' : '#94a3b8'
                : isDark ? '#3f3f46' : '#e5e7eb',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            }}
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
                {filteredItems.map((item) => {
                  const severityColor = SEVERITY_COLORS[item.severity] || '#94a3b8';
                  return (
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
                        borderBottomColor: isDark ? 'rgba(63,63,70,0.5)' : '#f3f4f6',
                      }}
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
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: isDark ? '#e4e4e7' : '#1e293b',
                        }}
                      >
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
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor,
            gap: 8,
          }}
        >
          {/* Header: "Seleccionadas (N)" + "Borrar todas" */}
          <View className="flex-row items-center justify-between mb-1">
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                }}
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
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: isDark ? '#e2e8f0' : '#0f172a',
                  }}
                >
                  {item.name} - {item.severity}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? '#94a3b8' : '#64748b'}
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
