import { AttachedRoutineSelection } from '@/src/hooks/useCreatePost';
import { useRoutinePreview } from '@/src/hooks/useRoutinePreview';
import { toast } from '@/src/components/ui/feedback';
import { getRoutineById } from '@/src/services/routine.service';
import { RoutineSummary } from '@/src/types/routine';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SKY = '#38bdf8';

interface AttachRoutinePickerProps {
  selected: AttachedRoutineSelection | null;
  onSelect: (routine: AttachedRoutineSelection | null) => void;
}

/**
 * Selector inline (sin Modal → idéntico en nativo y PWA) de una rutina PROPIA para adjuntar
 * al post. El backend pide el `versionId` (no el id de rutina), así que al elegir una rutina
 * se trae su detalle y se usa `activeVersionId` (la versión cuyo contenido ve el usuario).
 * Si la rutina no expone `activeVersionId`, no se puede adjuntar (no se inventa un id).
 */
export function AttachRoutinePicker({ selected, onSelect }: AttachRoutinePickerProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const { aiRoutines, manualRoutines, isLoading } = useRoutinePreview();
  /** Id de la rutina que se está resolviendo (para el spinner de esa card). */
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const routines = useMemo(
    () => [...aiRoutines, ...manualRoutines],
    [aiRoutines, manualRoutines],
  );

  const handlePick = useCallback(async (routine: RoutineSummary) => {
    if (resolvingId) return;
    setResolvingId(routine.id);
    try {
      const token = await getTokenRef.current();
      const full = await getRoutineById(routine.id, token);
      const versionId = full.activeVersionId ?? full.latestVersionId ?? null;
      if (!versionId) {
        toast.error('Esta rutina todavía no se puede compartir. Probá con otra.');
        return;
      }
      onSelect({ versionId, name: full.name });
    } catch {
      toast.error('No pudimos preparar esa rutina. Intentá de nuevo.');
    } finally {
      setResolvingId(null);
    }
  }, [resolvingId, onSelect]);

  return (
    <View className="mt-6">
      <Text className="text-white font-bold text-base px-1 mb-1">Adjuntar una rutina</Text>
      <Text className="text-zinc-500 text-sm px-1 mb-3">
        Opcional. Compartís la versión actual de una de tus rutinas.
      </Text>

      {/* Rutina seleccionada → chip con quitar */}
      {selected ? (
        <View className="flex-row items-center justify-between rounded-2xl border border-sky-400 bg-sky-400/10 p-3">
          <View className="flex-row items-center flex-1 pr-3">
            <Ionicons name="barbell" size={18} color={SKY} />
            <Text className="text-sky-400 font-semibold text-sm ml-2 flex-1" numberOfLines={1}>
              {selected.name}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onSelect(null)} hitSlop={8} className="p-1">
            <Ionicons name="close-circle" size={20} color={SKY} />
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color={SKY} />
        </View>
      ) : routines.length === 0 ? (
        <View className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 items-center">
          <Text className="text-zinc-500 text-sm text-center">
            No tenés rutinas para adjuntar. Podés publicar solo con texto.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {routines.map((routine) => {
            const isResolving = resolvingId === routine.id;
            return (
              <TouchableOpacity
                key={routine.id}
                onPress={() => handlePick(routine)}
                disabled={isResolving}
                activeOpacity={0.85}
                className="w-40 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 mr-3"
              >
                <View className="w-9 h-9 rounded-xl bg-zinc-800 items-center justify-center mb-2">
                  {isResolving ? (
                    <ActivityIndicator size="small" color={SKY} />
                  ) : (
                    <Ionicons name={routine.source === 'AI' ? 'sparkles' : 'barbell'} size={18} color={SKY} />
                  )}
                </View>
                <Text className="text-white font-semibold text-sm" numberOfLines={2}>
                  {routine.name}
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {routine.dayCount} {routine.dayCount === 1 ? 'día' : 'días'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
