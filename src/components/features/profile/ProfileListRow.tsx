import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ProfileListRowProps {
  /** Texto de la fila (ej. "Suscripción", "Versión") */
  label: string;
  /** Valor a la derecha (ej. "v0.15.0"). Si está presente y no hay onPress, no se muestra chevron */
  value?: string;
  /** Acción al tocar. Si falta, la fila es informativa (no presionable) */
  onPress?: () => void;
  /** Fuerza mostrar/ocultar el chevron (default: visible cuando hay onPress) */
  showChevron?: boolean;
  /** Estilo destructivo (texto rojo) para acciones como "Cerrar sesión" */
  destructive?: boolean;
}

/**
 * Fila atómica de la lista de perfil (estilo lista agrupada dark `zinc`).
 * Reemplaza a los `MenuItem`/`LogoutItem`/`ConfigMenuItem` paralelos.
 * Reutilizar SIEMPRE dentro de `ProfileListGroup`.
 */
export const ProfileListRow: React.FC<ProfileListRowProps> = ({
  label,
  value,
  onPress,
  showChevron,
  destructive,
}) => {
  const chevron = showChevron ?? !!onPress;
  const content = (
    <View className="flex-row items-center px-5 py-4">
      <Text className={`flex-1 text-base ${destructive ? 'text-red-400' : 'text-white'}`}>
        {label}
      </Text>
      {value ? <Text className="text-base text-zinc-500 mr-1">{value}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={18} className="text-zinc-600" /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
      {content}
    </TouchableOpacity>
  );
};
