import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ExerciseActionButtonsProps {
  /** Marca el set como incompleto y abre slider de reps parciales */
  onIncomplete: () => void;
  /** Finaliza la sesión anticipadamente */
  onFlag: () => void;
  /** Finaliza la serie actual */
  onNext: () => void;
}

/**
 * Barra de tres botones de acción para la fase de ejercicio.
 * Los colores son de acción y no varían entre light/dark.
 */
export const ExerciseActionButtons: React.FC<ExerciseActionButtonsProps> = ({
  onIncomplete,
  onFlag,
  onNext,
}) => (
  <View className="flex-1 flex-row gap-3">
    {/* Incompleto — abre slider de reps parciales */}
    <TouchableOpacity
      className="flex-1 rounded-2xl items-center justify-center bg-orange-400"
      onPress={onIncomplete}
    >
      <Ionicons name="ban-outline" size={60} color="white" />
    </TouchableOpacity>

    {/* Bandera — finalizar sesión */}
    <TouchableOpacity
      className="flex-1 rounded-2xl items-center justify-center bg-red-500"
      onPress={onFlag}
    >
      <Ionicons name="flag" size={60} color="white" />
    </TouchableOpacity>

    {/* Siguiente — finalizar serie */}
    <TouchableOpacity
      className="flex-1 rounded-2xl items-center justify-center bg-lime-400"
      onPress={onNext}
    >
      <Ionicons name="arrow-forward" size={60} color="black" />
    </TouchableOpacity>
  </View>
);
