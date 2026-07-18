import { IconTile } from '@/src/components/common/IconTile';
import { ForumAttachedRoutine, ForumFlag, ForumRoutineExercise } from '@/src/types/forum';
import { RoutineDayName } from '@/src/types/nutritionRoutine';
import { ROUTINE_DAY_FULL_LABELS } from '@/src/utils/nutritionRoutine.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, LayoutAnimation, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';

const SKY = '#38bdf8';
const AMBER = '#fbbf24';

/** Orden canónico de la semana (el back manda "Monday".."Sunday"). */
const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Índice de orden de un día; los desconocidos van al final preservando su posición. */
const weekdayIndex = (day: string): number => {
  const index = WEEKDAY_ORDER.indexOf(day);
  return index === -1 ? WEEKDAY_ORDER.length : index;
};

/** Traduce el día a español reutilizando el mapa del repo; si no matchea, deja el original. */
const spanishDay = (day: string): string =>
  ROUTINE_DAY_FULL_LABELS[day as RoutineDayName] ?? day;

// Habilita LayoutAnimation en Android (no-op en iOS/web, donde ya funciona/es inocuo).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Texto de repeticiones según el tipo (Fixed/Range/Timed). Solo campos reales del snapshot. */
function repsLabel(ex: ForumRoutineExercise): string {
  if (ex.repType === 'Timed') {
    return ex.durationSeconds != null ? `${ex.durationSeconds} s` : '—';
  }
  if (ex.repType === 'Range' && ex.minRep != null && ex.maxRep != null) {
    return `${ex.minRep}–${ex.maxRep} reps`;
  }
  // Fixed (o Range incompleto): mostramos el valor de rep disponible.
  const fixed = ex.minRep ?? ex.maxRep;
  return fixed != null ? `${fixed} reps` : '—';
}

/** Texto de carga según el tipo. */
function loadLabel(ex: ForumRoutineExercise): string {
  if (ex.loadType === 'ExternalWeight' && ex.plannedWeightKg != null) {
    return `${ex.plannedWeightKg} kg`;
  }
  return 'Peso corporal';
}

interface AttachedRoutineSnapshotViewProps {
  routine: ForumAttachedRoutine;
  /** Flags del post: sus `affectedExerciseIds` resaltan los ejercicios afectados. */
  flags: ForumFlag[];
}

/**
 * Vista READ-ONLY del snapshot de la rutina adjunta a un post (NO es el editor de Fitness).
 * Días ordenados de lunes a domingo y en español, en acordeón (colapsados por defecto salvo
 * el primero) para no ocupar espacio. Los ejercicios cuyo `exerciseId` está en algún
 * `flag.affectedExerciseIds` se resaltan en ámbar. No se inventan campos que el snapshot no trae.
 */
export function AttachedRoutineSnapshotView({ routine, flags }: AttachedRoutineSnapshotViewProps) {
  const affectedIds = useMemo(() => {
    const set = new Set<string>();
    flags.forEach((flag) => flag.affectedExerciseIds.forEach((id) => set.add(id)));
    return set;
  }, [flags]);

  const sortedDays = useMemo(
    () => [...routine.days].sort((a, b) => weekdayIndex(a.dayOfWeek) - weekdayIndex(b.dayOfWeek)),
    [routine.days],
  );

  // Todos los días colapsados por defecto (se expanden al tocar).
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set<number>());

  const toggleDay = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View className="mt-2 px-4">
      {sortedDays.map((day, dayIndex) => {
        const isOpen = expanded.has(dayIndex);
        return (
          <View key={`${day.dayOfWeek}-${dayIndex}`} className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {/* Cabecera del día (toca para expandir/colapsar) */}
            <TouchableOpacity
              onPress={() => toggleDay(dayIndex)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between px-4 py-3.5"
            >
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{spanishDay(day.dayOfWeek)}</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                  {day.approxTimeSession > 0 ? ` · ~${day.approxTimeSession} min` : ''}
                </Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
            </TouchableOpacity>

            {/* Ejercicios ordenados por `order` (solo si el día está expandido) */}
            {isOpen && (
              <View className="px-3 pb-3">
                {[...day.exercises]
                  .sort((a, b) => a.order - b.order)
                  .map((ex) => {
                    const isAffected = affectedIds.has(ex.exerciseId);
                    return (
                      <View
                        key={ex.exerciseId}
                        className={`flex-row items-center rounded-xl p-3 mb-2 border ${
                          isAffected ? 'border-amber-400/50 bg-amber-400/10' : 'border-zinc-800 bg-zinc-950'
                        }`}
                      >
                        {ex.gifUrl ? (
                          <Image
                            source={{ uri: ex.gifUrl }}
                            className="w-12 h-12 rounded-xl bg-zinc-800"
                            resizeMode="cover"
                          />
                        ) : (
                          <IconTile name="barbell" color={SKY} size={48} iconSize={22} />
                        )}

                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center">
                            <Text className="text-white font-semibold text-sm flex-1" numberOfLines={1}>
                              {ex.name}
                            </Text>
                            {isAffected && <Ionicons name="warning-outline" size={15} color={AMBER} />}
                          </View>
                          <Text className="text-zinc-400 text-xs mt-1">
                            {ex.sets} series · {repsLabel(ex)} · {loadLabel(ex)}
                            {ex.rest != null ? ` · descanso ${ex.rest}s` : ''}
                          </Text>
                          {ex.primaryMuscleGroup ? (
                            <Text className="text-zinc-600 text-xs mt-0.5 capitalize">
                              {ex.primaryMuscleGroup}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
