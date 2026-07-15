import { EffortSelector } from '@/src/components/common/EffortSelector';
import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
import { DraftExercise, DraftSet } from '@/src/hooks/useManualSessionForm';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ManualExerciseCardProps {
  exercise: DraftExercise;
  index: number;
  /** Si la card está expandida (acordeón controlado desde el hook). */
  expanded: boolean;
  onToggle: (key: string) => void;
  onRemove: (key: string) => void;
  onAddSet: (exerciseKey: string) => void;
  onRemoveSet: (exerciseKey: string, setKey: string) => void;
  onUpdateSet: (
    exerciseKey: string,
    setKey: string,
    patch: Partial<Omit<DraftSet, 'key'>>,
  ) => void;
}

/** Fila etiqueta + stepper, para editar un valor del set sin pelear con el scroll. */
function StepperField({
  label,
  value,
  onChange,
  unit = '',
  max = 999,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  max?: number;
  decimal?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between mt-2">
      <Text className="text-zinc-400 text-sm w-16">{label}</Text>
      <View className="flex-1 ml-3">
        <QuantityStepper
          value={value}
          onChange={onChange}
          step={1}
          min={0}
          max={max}
          unit={unit}
          accent="lime"
          editable
          decimal={decimal}
        />
      </View>
    </View>
  );
}

/** Editor de una serie: número + botón eliminar + steppers de reps/peso/RPE. */
function ManualSetRow({
  set,
  index,
  canRemove,
  onRemove,
  onUpdate,
}: {
  set: DraftSet;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<Omit<DraftSet, 'key'>>) => void;
}) {
  return (
    <View className={`px-1 py-4 ${index > 0 ? 'border-t border-zinc-800' : ''}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-zinc-300 text-base font-semibold">Serie {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8} className="p-1">
            <Ionicons name="close-circle-outline" size={20} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      <StepperField label="Reps" value={set.reps} onChange={(v) => onUpdate({ reps: v })} />
      <StepperField
        label="Peso"
        value={set.weight}
        onChange={(v) => onUpdate({ weight: v })}
        unit="kg"
        decimal
      />

      {/* Esfuerzo: mismas 4 categorías que la sesión en vivo, sin preselección.
          Si el usuario no toca nada, la serie se registra sin esfuerzo (`null`). */}
      <View className="mt-3">
        <Text className="text-zinc-400 text-sm mb-2">Esfuerzo</Text>
        <EffortSelector value={set.rpe} onChange={(v) => onUpdate({ rpe: v })} />
      </View>
    </View>
  );
}

/**
 * Card de un ejercicio dentro del form de sesión manual (dark zinc / acento lime,
 * mismo lenguaje visual que SessionExerciseCard del detalle). Muestra el ejercicio
 * elegido del catálogo y permite editar/agregar/quitar sus series.
 */
export function ManualExerciseCard({
  exercise,
  index,
  expanded,
  onToggle,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: ManualExerciseCardProps) {
  const setCount = exercise.sets.length;

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl mb-4 overflow-hidden">
      {/* Header: tocarlo colapsa/expande el contenido */}
      <View className="flex-row items-center p-5">
        <TouchableOpacity
          onPress={() => onToggle(exercise.key)}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center"
        >
          <View className="w-9 h-9 rounded-full border border-zinc-700 items-center justify-center mr-3 flex-shrink-0">
            <Text className="text-zinc-300 text-sm font-semibold">{index + 1}</Text>
          </View>
          <ExerciseThumbnail
            uri={exercise.gifUrl}
            size={44}
            className="bg-zinc-800 mr-3"
            iconColor="#71717a"
          />
          <View className="flex-1 mr-2">
            <Text className="text-white font-semibold text-base" numberOfLines={2}>
              {exercise.name}
            </Text>
            <Text className="text-zinc-500 text-sm mt-0.5">
              {setCount} {setCount === 1 ? 'serie' : 'series'}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#a3e635" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onRemove(exercise.key)} hitSlop={8} className="p-1 ml-2">
          <Ionicons name="trash-outline" size={20} color="#f87171" />
        </TouchableOpacity>
      </View>

      {/* Series (colapsable) */}
      {expanded && (
        <View className="border-t border-zinc-800 px-4">
          {exercise.sets.map((set, i) => (
            <ManualSetRow
              key={set.key}
              set={set}
              index={i}
              canRemove={exercise.sets.length > 1}
              onRemove={() => onRemoveSet(exercise.key, set.key)}
              onUpdate={(patch) => onUpdateSet(exercise.key, set.key, patch)}
            />
          ))}

          <TouchableOpacity
            onPress={() => onAddSet(exercise.key)}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-4 gap-1.5"
          >
            <Ionicons name="add-circle-outline" size={18} color="#a3e635" />
            <Text className="text-lime-400 text-sm font-semibold">Agregar serie</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
