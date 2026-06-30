import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
import { CreateRoutineExercise } from '@/src/types/create-routine';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface EditExerciseCardProps {
  exercise: CreateRoutineExercise;
  index: number;
  onOpenPicker: (field: 'sets' | 'reps' | 'restSeconds' | 'weight') => void;
  onRemove: (exId: string) => void;
  onReplace: (exId: string) => void;
  canReplace?: boolean;
  onToggleRepMode: (exId: string) => void;
  onDrag: () => void;
  isActive: boolean;
}

/** Stat de la fila inferior: label gris arriba, valor abajo. Al tocar abre el wheel picker. */
const EditStat = ({
  label, value, onPress, onLabelPress, icon, accent,
}: {
  label: string;
  value: string;
  onPress: () => void;
  onLabelPress?: () => void;
  /** Ícono opcional a la izquierda del label (p.ej. la pesa en Peso). */
  icon?: React.ReactNode;
  /** Resalta el valor en lima (se usa cuando el peso está seteado). */
  accent?: boolean;
}) => (
  <TouchableOpacity onPress={onPress} hitSlop={8} className="flex-1 items-center" activeOpacity={0.6}>
    {onLabelPress ? (
      <TouchableOpacity onPress={onLabelPress} hitSlop={6} className="flex-row items-center mb-1">
        <Text className="text-zinc-500 text-[10px] uppercase tracking-wide">{label}</Text>
        <Ionicons name="swap-horizontal" size={9} color="#52525b" style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    ) : (
      <View className="flex-row items-center mb-1">
        {icon}
        <Text className="text-zinc-500 text-[10px] uppercase tracking-wide" style={icon ? { marginLeft: 3 } : undefined}>
          {label}
        </Text>
      </View>
    )}
    <Text className={`font-bold text-base ${accent ? 'text-lime-400' : 'text-white'}`} numberOfLines={1}>
      {value}
    </Text>
  </TouchableOpacity>
);

/**
 * Card de ejercicio del modo edición de rutina (dark zinc). Dos filas: arriba la
 * identidad (handle de drag, orden, imagen, nombre y menú) y abajo una fila de
 * stats con aire (Sets, Reps/Seg, Rest, Peso) que al tocar abren el wheel picker.
 * El peso siempre se muestra como un stat más, leído de plannedWeightKg.
 */
export const EditExerciseCard: React.FC<EditExerciseCardProps> = ({
  exercise, index, onOpenPicker, onRemove, onReplace, canReplace = true, onToggleRepMode, onDrag, isActive,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const hasWeight = exercise.loadType === 'ExternalWeight' && exercise.plannedWeightKg != null;
  const weightValue = hasWeight ? `${exercise.plannedWeightKg} kg` : 'Corporal';

  const openMenu = () => {
    const actions: { label: string; onPress: () => void; destructive?: boolean }[] = [
      ...(canReplace ? [{ label: 'Cambiar ejercicio', onPress: () => onReplace(exercise.id) }] : []),
      { label: 'Eliminar', onPress: () => onRemove(exercise.id), destructive: true },
    ];
    const options = [...actions.map((a) => a.label), 'Cancelar'];

    showActionSheetWithOptions(
      {
        title: exercise.name,
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: actions.findIndex((a) => a.destructive),
        containerStyle: { backgroundColor: '#18181b' },
        textStyle: { color: '#f4f4f5' },
        titleTextStyle: { color: '#a1a1aa' },
        destructiveColor: '#f87171',
      },
      (selectedIndex) => {
        if (selectedIndex != null && selectedIndex < actions.length) {
          actions[selectedIndex].onPress();
        }
      },
    );
  };

  const renderRightActions = () => (
    <View className="flex-row ml-3 mb-3 gap-2">
      {canReplace && (
        <TouchableOpacity
          onPress={() => { swipeableRef.current?.close(); onReplace(exercise.id); }}
          className="bg-blue-500 rounded-2xl items-center justify-center px-4"
        >
          <Ionicons name="swap-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => onRemove(exercise.id)}
        className="bg-red-500 rounded-2xl items-center justify-center px-4"
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} enabled={!isActive}>
      <View
        className="bg-zinc-900 rounded-2xl border border-white/10 p-3 mb-3"
        style={isActive ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } : undefined}
      >
        {/* Fila 1 — identidad: handle, orden, imagen, nombre, menú */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onLongPress={onDrag} delayLongPress={150} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <MaterialCommunityIcons name="drag-vertical" size={22} color="#52525b" />
          </TouchableOpacity>

          <Text className="text-zinc-600 font-bold text-sm w-4 text-center">{index + 1}</Text>

          <ExerciseThumbnail uri={exercise.gifUrl} size={48} />

          <Text className="flex-1 text-white font-bold text-sm" numberOfLines={2}>{exercise.name}</Text>

          <TouchableOpacity
            onPress={openMenu}
            className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            hitSlop={6}
          >
            <Ionicons name="ellipsis-vertical" size={16} className="text-zinc-300" />
          </TouchableOpacity>
        </View>

        {/* Fila 2 — stats editables con aire (todas abren el wheel picker) */}
        <View className="flex-row items-start mt-3 pt-3 border-t border-white/5">
          <EditStat label="Sets" value={String(exercise.sets)} onPress={() => onOpenPicker('sets')} />
          <EditStat
            label={exercise.repMode === 'secs' ? 'Seg' : 'Reps'}
            value={String(exercise.reps)}
            onPress={() => onOpenPicker('reps')}
            onLabelPress={() => onToggleRepMode(exercise.id)}
          />
          <EditStat label="Rest" value={`${exercise.restSeconds}s`} onPress={() => onOpenPicker('restSeconds')} />
          <EditStat
            label="Peso"
            value={weightValue}
            accent={hasWeight}
            icon={<MaterialCommunityIcons name="weight-kilogram" size={11} color={hasWeight ? '#a3e635' : '#71717a'} />}
            onPress={() => onOpenPicker('weight')}
          />
        </View>
      </View>
    </Swipeable>
  );
};
