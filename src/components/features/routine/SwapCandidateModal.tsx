import { translateEquipment, translateMuscle } from '@/src/i18n';
import { SwapCandidate, SwapSuggestionItem } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SwapCandidateModalProps {
  /** La sugerencia (incluye el ejercicio original y sus candidatos). */
  suggestion: SwapSuggestionItem | null;
  /** ID del candidato actualmente elegido para este ejercicio (o null si "mantener actual"). */
  currentPickExerciseId: string | null | undefined;
  /** True para modo IA: habilita visualización de score de IA. */
  isAiMode: boolean;
  onPick: (candidate: SwapCandidate | null) => void;
  onClose: () => void;
}

/**
 * Modal de selección de candidato para reemplazar un ejercicio.
 * Muestra hasta 3 candidatos + opción "Mantener actual".
 */
export const SwapCandidateModal: React.FC<SwapCandidateModalProps> = ({
  suggestion,
  currentPickExerciseId,
  isAiMode,
  onPick,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const visible = !!suggestion;

  // Ordeno candidatos por score desc en modo determinista (informativo)
  const candidates = React.useMemo(() => {
    if (!suggestion) return [];
    return [...suggestion.candidates].sort((a, b) => b.score - a.score);
  }, [suggestion]);

  const isKeepCurrentSelected = currentPickExerciseId === null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={onClose} />

        <View
          style={{ paddingBottom: insets.bottom + 16, maxHeight: '85%' }}
          className="bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-zinc-200 dark:border-white/10"
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </View>

          {/* Header */}
          <View className="px-6 pt-2 pb-4 border-b border-zinc-200 dark:border-white/10 flex-row items-center">
            <View className="flex-1">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                Reemplazar
              </Text>
              <Text className="text-zinc-900 dark:text-white text-lg font-bold" numberOfLines={1}>
                {suggestion?.replaces.exerciseName ?? ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="bg-zinc-100 dark:bg-white/10 p-2 rounded-full ml-3"
            >
              <Ionicons name="close" size={20} className="text-zinc-700 dark:text-white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 pt-3" showsVerticalScrollIndicator={false}>
            {/* Opción: Mantener actual */}
            <TouchableOpacity
              onPress={() => onPick(null)}
              activeOpacity={0.85}
              className={`flex-row items-center bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-3 border-2 ${
                isKeepCurrentSelected
                  ? 'border-lime-400'
                  : 'border-transparent'
              }`}
            >
              <View className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl items-center justify-center">
                <Ionicons name="lock-closed-outline" size={28} className="text-zinc-500 dark:text-zinc-400" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-zinc-900 dark:text-white font-bold text-base">
                  Mantener actual
                </Text>
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                  No reemplazar este ejercicio
                </Text>
              </View>
              {isKeepCurrentSelected && (
                <Ionicons name="checkmark-circle" size={24} className="text-lime-500" />
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View className="flex-row items-center my-2 px-2">
              <View className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
              <Text className="mx-3 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                Candidatos
              </Text>
              <View className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
            </View>

            {/* Candidatos */}
            {candidates.map((c) => {
              const isSelected = currentPickExerciseId === c.exerciseId;
              return (
                <TouchableOpacity
                  key={c.exerciseId}
                  activeOpacity={0.85}
                  onPress={() => onPick(c)}
                  className={`flex-row bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-3 border-2 ${
                    isSelected
                      ? 'border-lime-400'
                      : 'border-transparent'
                  }`}
                >
                  {c.gifUrl ? (
                    <Image
                      source={{ uri: c.gifUrl }}
                      className="w-20 h-20 bg-white rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl items-center justify-center">
                      <Ionicons name="image-outline" size={24} className="text-zinc-400" />
                    </View>
                  )}

                  <View className="flex-1 ml-4">
                    <Text className="text-zinc-900 dark:text-white font-bold text-base mb-1" numberOfLines={2}>
                      {c.name}
                    </Text>

                    {/* Tags: target muscles + equipment */}
                    <View className="flex-row flex-wrap gap-1.5 mb-1">
                      {c.targetMuscles.slice(0, 2).map((m) => (
                        <View
                          key={`m-${m}`}
                          className="px-2 py-0.5 rounded-full bg-lime-500/10 dark:bg-lime-500/15"
                        >
                          <Text className="text-zinc-900 dark:text-lime-300 text-[10px] font-semibold">
                            {translateMuscle(m)}
                          </Text>
                        </View>
                      ))}
                      {c.equipments.slice(0, 1).map((e) => (
                        <View
                          key={`e-${e}`}
                          className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800"
                        >
                          <Text className="text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                            {translateEquipment(e)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Score */}
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={12} className="text-amber-400" />
                      <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">
                        Compatibilidad: {c.score}/10
                      </Text>
                      {isAiMode && (
                        <View className="ml-2 flex-row items-center bg-lime-500/10 dark:bg-lime-500/15 px-1.5 py-0.5 rounded-md">
                          <Ionicons name="sparkles" size={10} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-[10px] text-zinc-900 dark:text-lime-300 font-bold ml-1 uppercase">IA</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} className="text-lime-500 self-center ml-2" />
                  )}
                </TouchableOpacity>
              );
            })}

            {candidates.length === 0 && (
              <View className="items-center py-8">
                <Ionicons name="alert-circle-outline" size={32} className="text-zinc-400" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                  No se encontraron candidatos
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
