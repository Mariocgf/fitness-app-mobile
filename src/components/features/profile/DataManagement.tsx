import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface DataManagementProps {
  /** Callback para volver (lo dispara el nav bar compartido; aceptado por compatibilidad) */
  onBack?: () => void;
}

/**
 * Sub-pantalla de manejo de datos (placeholder). Dark-only `zinc`.
 * El back lo provee el nav bar compartido del perfil (sin BackButton propio).
 * Se completará con funcionalidad real más adelante.
 */
export default function DataManagement(_props: DataManagementProps) {
  return (
    <View className="flex-1 bg-zinc-950">
      {/* Título */}
      <View className="px-8 pt-4 pb-4">
        <Text className="text-2xl font-bold text-white">Manejo de datos</Text>
      </View>

      {/* Placeholder */}
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="construct-outline" size={64} className="text-zinc-600" />
        <Text className="text-lg font-semibold text-zinc-500 mt-4 text-center">
          Próximamente
        </Text>
        <Text className="text-sm text-zinc-600 mt-2 text-center">
          Aquí podrás gestionar tus datos personales.
        </Text>
      </View>
    </View>
  );
}
