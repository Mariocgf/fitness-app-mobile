import { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface SocialAuthButtonProps {
  /** Texto del botón (ej. "Continuar con Google") */
  label: string;
  /** Ícono a la izquierda del texto (SVG del proveedor) */
  icon: ReactNode;
  /** Variante visual: claro (acción primaria) u oscuro (secundaria) */
  variant: 'light' | 'dark';
  /** Callback al presionar */
  onPress: () => void;
  /** Muestra un spinner (reemplaza al ícono) y bloquea el botón mientras corre el flujo de auth */
  loading?: boolean;
  /** Deshabilita el botón sin spinner (ej. cuando OTRO proveedor está autenticando) */
  disabled?: boolean;
}

/**
 * Botón de autenticación social (dark-only `zinc`).
 * - `light`: superficie `white` + texto `zinc-900` (acción primaria, ej. Google).
 * - `dark`: superficie `zinc-900` con borde `zinc-800` + texto `white` (secundaria, ej. Apple).
 */
export function SocialAuthButton({
  label,
  icon,
  variant,
  onPress,
  loading = false,
  disabled = false,
}: SocialAuthButtonProps) {
  const isLight = variant === 'light';
  const isBlocked = loading || disabled;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center py-4 rounded-2xl ${
        isLight ? 'bg-white' : 'bg-zinc-900 border border-zinc-800'
      } ${isBlocked ? 'opacity-60' : ''}`}
      onPress={onPress}
      disabled={isBlocked}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isLight ? '#18181b' : '#ffffff'} />
      ) : (
        icon
      )}
      <Text className={`text-base font-semibold ml-3 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
        {loading ? 'Ingresando...' : label}
      </Text>
    </TouchableOpacity>
  );
}
