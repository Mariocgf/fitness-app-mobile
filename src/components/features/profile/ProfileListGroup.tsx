import React from 'react';
import { Text, View } from 'react-native';

interface ProfileListGroupProps {
  /** Encabezado de sección en mayúsculas (ej. "CUENTA"). Opcional para grupos sueltos */
  title?: string;
  /** Filas (`ProfileListRow`) del grupo */
  children: React.ReactNode;
}

/**
 * Grupo de la lista de perfil: encabezado opcional + card `zinc-900` a ancho completo
 * con divisores entre filas (estilo lista agrupada). Inserta los separadores
 * automáticamente entre hijos, sin que cada fila tenga que saber si es la última.
 */
export const ProfileListGroup: React.FC<ProfileListGroupProps> = ({ title, children }) => {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View className="mb-7">
      {title ? (
        <Text className="px-5 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </Text>
      ) : null}
      <View className="bg-zinc-900 overflow-hidden">
        {items.map((child, index) => (
          <View key={index}>
            {child}
            {index < items.length - 1 ? <View className="h-px bg-zinc-800 ml-5" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
};
