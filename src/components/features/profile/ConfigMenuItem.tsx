import React from 'react';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfigMenuItemProps {
  /** Nombre del ícono de Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Texto del menú */
  label: string;
  /** Callback al presionar */
  onPress: () => void;
}

/**
 * Ítem de menú de configuración en la pantalla de perfil.
 * Muestra un ícono, el label y una flecha hacia la derecha.
 */
export default function ConfigMenuItem({
  icon,
  label,
  onPress,
}: ConfigMenuItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#27272a' : '#f1f5f9',
      }}
    >
      {/* Ícono */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: isDark ? '#27272a' : '#f8fafc',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isDark ? '#a1a1aa' : '#64748b'}
        />
      </View>

      {/* Label */}
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          color: isDark ? '#e4e4e7' : '#1e293b',
        }}
      >
        {label}
      </Text>

      {/* Flecha */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? '#52525b' : '#cbd5e1'}
      />
    </TouchableOpacity>
  );
}
