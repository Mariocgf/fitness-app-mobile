import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconTileProps {
  /** Ícono de Ionicons a mostrar */
  name: IoniconName;
  /** Color del ícono (default amber-400) */
  color?: string;
  /** Tamaño del ícono en px (default 22) */
  iconSize?: number;
  /** Lado del cuadrado en px (default 44) */
  size?: number;
  /** Fondo del tile (default `bg-zinc-800`) */
  className?: string;
}

/**
 * Átomo de tile cuadrado con ícono centrado. Es el contenedor redondeado que
 * acompaña filas de macros, comidas y tarjetas informativas. Reutilizar SIEMPRE
 * en vez de copiar el `<View rounded-2xl items-center justify-center><Ionicons/></View>`.
 */
export function IconTile({
  name,
  color = '#fbbf24',
  iconSize = 22,
  size = 44,
  className = 'bg-zinc-800',
}: IconTileProps) {
  return (
    <View
      style={{ width: size, height: size }}
      className={`rounded-2xl items-center justify-center ${className}`}
    >
      <Ionicons name={name} size={iconSize} color={color} />
    </View>
  );
}
