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
import { Ionicons } from '@expo/vector-icons';
import { HealthItem } from '@/src/types/health';

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
}

export default function SearchableSelect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Seleccionar - Opcional',
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

  return (
    <View>
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
            backgroundColor: isDark ? '#27272a' : '#ffffff',
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
                    <View
                      style={{
                        backgroundColor: severityColor,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                        {item.severity}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {selectedItems.length > 0 && (
        <View style={{ marginTop: 12, gap: 8 }}>
          {selectedItems.map((item) => {
            const bgColor = SEVERITY_COLORS[item.severity] || '#94a3b8';
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: bgColor,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
                  {item.name} - {item.severity}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
