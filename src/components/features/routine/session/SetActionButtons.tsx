import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const LIME = '#a3e635'; // lime-400

/** Definición de uno de los dos botones grandes de la sección */
interface SetAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface SetActionButtonsProps {
  /** Botón izquierdo (ej. "Serie incompleta") */
  left: SetAction;
  /** Botón derecho (ej. "Completar serie") */
  right: SetAction;
  /**
   * Acción del enlace inferior (ej. finalizar la rutina). Si se omite, el enlace
   * se oculta pero **reserva su espacio**, para que los dos botones grandes
   * mantengan tamaño y posición idénticos entre ejecución y descanso.
   */
  onFinish?: () => void;
  /** Texto del enlace inferior */
  finishLabel?: string;
}

/**
 * Sección de acciones de la sesión: dos botones grandes bordeados (icono + label)
 * y debajo un enlace tenue para finalizar la rutina.
 * Pensada para compartirse entre la fase de ejecución y la de descanso (los labels
 * e iconos se configuran por props). La sección es "estática": su tamaño y la
 * posición de los dos botones no cambian aunque el enlace inferior se oculte.
 */
export const SetActionButtons: React.FC<SetActionButtonsProps> = ({
  left,
  right,
  onFinish,
  finishLabel = 'Finalizar rutina',
}) => (
  <View>
    <View className="flex-row gap-3">
      {[left, right].map((action, index) => (
        <TouchableOpacity
          key={index}
          onPress={action.onPress}
          activeOpacity={0.85}
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 py-6 items-center justify-center gap-3"
        >
          <Ionicons name={action.icon} size={30} color={LIME} />
          <Text className="text-white text-base font-medium">{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Enlace inferior: invisible y no interactivo cuando no hay onFinish, pero ocupa el mismo alto */}
    <View
      className="border-t border-zinc-800 mt-5 pt-4"
      style={{ opacity: onFinish ? 1 : 0 }}
      pointerEvents={onFinish ? 'auto' : 'none'}
    >
      <TouchableOpacity
        onPress={onFinish}
        activeOpacity={0.7}
        className="flex-row items-center justify-center gap-2"
      >
        <Ionicons name="flag-outline" size={18} color="#71717a" />
        <Text className="text-zinc-500 text-base">{finishLabel}</Text>
      </TouchableOpacity>
    </View>
  </View>
);
