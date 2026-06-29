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
  weightLabel: string;
  onOpenPicker: (field: 'sets' | 'reps' | 'restSeconds' | 'weight') => void;
  onRemove: (exId: string) => void;
  onReplace: (exId: string) => void;
  canReplace?: boolean;
  onToggleRepMode: (exId: string) => void;
  onDrag: () => void;
  isActive: boolean;
}

/** Stat inline (label gris arriba, valor blanco abajo) — al tocar abre el wheel picker */
const EditStat = ({
  label, value, onPress, onLabelPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
  onLabelPress?: () => void;
}) => (
  <View className="items-center" style={{ minWidth: 40 }}>
    {onLabelPress ? (
      <TouchableOpacity onPress={onLabelPress} hitSlop={6} className="flex-row items-center mb-0.5">
        <Text className="text-zinc-500 text-[10px]">{label}</Text>
        <Ionicons name="swap-horizontal" size={9} color="#52525b" style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    ) : (
      <Text className="text-zinc-500 text-[10px] mb-0.5">{label}</Text>
    )}
    <TouchableOpacity onPress={onPress} hitSlop={8} className="px-1">
      <Text className="text-white font-bold text-sm text-center">{value}</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Card de ejercicio del modo edición de rutina (dark zinc). Handle de drag a la
 * izquierda (long-press), stats tocables que abren el wheel picker, swipe a la
 * derecha para cambiar/eliminar y menú de 3 puntos con las mismas acciones.
 */
export const EditExerciseCard: React.FC<EditExerciseCardProps> = ({
  exercise, index, weightLabel, onOpenPicker, onRemove, onReplace, canReplace = true, onToggleRepMode, onDrag, isActive,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const openMenu = () => {
    const actions: { label: string; onPress: () => void; destructive?: boolean }[] = [
      ...(canReplace ? [{ label: 'Cambiar ejercicio', onPress: () => onReplace(exercise.id) }] : []),
      { label: `Peso: ${weightLabel}`, onPress: () => onOpenPicker('weight') },
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
        className="flex-row items-center gap-2 bg-zinc-900 rounded-2xl border border-white/10 p-3 mb-3"
        style={isActive ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } : undefined}
      >
        {/* Handle de 6 puntos (izquierda) — long-press para arrastrar */}
        <TouchableOpacity onLongPress={onDrag} delayLongPress={150} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <MaterialCommunityIcons name="drag-vertical" size={22} color="#52525b" />
        </TouchableOpacity>

        {/* Número de orden */}
        <Text className="text-zinc-600 font-bold text-sm w-4 text-center">{index + 1}</Text>

        {/* GIF / imagen */}
        <ExerciseThumbnail uri={exercise.gifUrl} size={56} />

        {/* Nombre */}
        <Text className="flex-1 text-white font-bold text-sm" numberOfLines={2}>{exercise.name}</Text>

        {/* Stats — al tocar abren el wheel picker */}
        <EditStat label="Sets" value={String(exercise.sets)} onPress={() => onOpenPicker('sets')} />
        <EditStat
          label={exercise.repMode === 'secs' ? 'Seg' : 'Reps'}
          value={String(exercise.reps)}
          onPress={() => onOpenPicker('reps')}
          onLabelPress={() => onToggleRepMode(exercise.id)}
        />
        <EditStat label="Rest" value={String(exercise.restSeconds)} onPress={() => onOpenPicker('restSeconds')} />

        {/* Menú de 3 puntos (derecha) */}
        <TouchableOpacity
          onPress={openMenu}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center ml-1"
          hitSlop={6}
        >
          <Ionicons name="ellipsis-vertical" size={16} className="text-zinc-300" />
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
};
