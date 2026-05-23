import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import { ExerciseDetailView } from '@/src/components/features/routine/ExerciseDetailView';
import { SwapCandidateModal } from '@/src/components/features/routine/SwapCandidateModal';
import { translateDay } from '@/src/i18n';
import { confirmSwapExercises, getSwapSuggestions } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { HealthWarning, Routine, RoutineExercise, SwapSuggestionItem, WarningLevel } from '@/src/types/routine';
import { formatReps } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SkeletonItem = ({ className }: { className?: string }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
};

cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

cssInterop(MaterialCommunityIcons, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              RoutineDetailView                              */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Peso para ordenar los días de la semana cronológicamente */
const getDayWeight = (dayLabel: string): number => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const lower = dayLabel.toLowerCase();
  const index = days.findIndex(d => lower.includes(d));
  return index !== -1 ? index : 99;
};

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoutineDetailViewProps {
  routine: Routine;
  onClose: () => void;
  cardLayout: CardLayout;
  isGenerating?: boolean;
  /** Oculta el botón de play (rutina guardada pero no activa). */
  readOnly?: boolean;
  /** Callback para regenerar la rutina (lo dispara el FAB del MyTabBar). */
  onRegenerate: () => void;
  /** Notifica al padre cuando la rutina cambió por un swap aplicado. */
  onRoutineUpdated: (routine: Routine) => void;
  /** Callback para editar la rutina (solo manuales). */
  onEdit?: () => void;
  /** Callback para eliminar la rutina. */
  onDelete?: () => void;
  /** Callback para activar la rutina como activa (solo no-activas). */
  onActivate?: () => void;
}

/** Altura de la bottom bar de la vista de detalle (Play + Opciones) */
const BOTTOM_BAR_HEIGHT = 80;

export const RoutineDetailView: React.FC<RoutineDetailViewProps> = ({
  routine,
  onClose,
  cardLayout,
  isGenerating = false,
  readOnly = false,
  onRegenerate,
  onRoutineUpdated,
  onEdit,
  onDelete,
  onActivate,
}) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { getToken } = useAuth();
  const { isSwapMode, setSwapMode, setActions } = useRoutineDetailContext();

  /* ── Estado del flujo de swap ──────────────────────────────────────────── */

  /** routineExerciseIds que el usuario marcó para reemplazar */
  const [selectedForSwap, setSelectedForSwap] = useState<Set<string>>(new Set());
  /** routineExerciseIds que están esperando respuesta del backend */
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  /** Sugerencias listas por routineExerciseId */
  const [suggestions, setSuggestions] = useState<Record<string, SwapSuggestionItem>>({});
  /** Elección por routineExerciseId: exerciseId nuevo, o null = mantener actual */
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  /** True si las sugerencias actuales vienen del modo IA */
  const [activeAiMode, setActiveAiMode] = useState(false);
  /** Modo pendiente de confirmar antes de llamar al endpoint */
  const [pendingMode, setPendingMode] = useState<'standard' | 'ai' | null>(null);
  /** Warnings High que bloquean hasta que el usuario confirma */
  const [blockingWarning, setBlockingWarning] = useState<{ warnings: HealthWarning[]; level: WarningLevel } | null>(null);
  /** Warnings Medium/Low que se muestran como banner persistente */
  const [softWarning, setSoftWarning] = useState<{ warnings: HealthWarning[]; level: WarningLevel } | null>(null);
  /** routineExerciseId cuyo modal de candidatos está abierto */
  const [openCandidateFor, setOpenCandidateFor] = useState<string | null>(null);
  /** True mientras POST /swap-exercises está en vuelo */
  const [isApplying, setIsApplying] = useState(false);

  /** Progreso de la animación: 0 = tamaño card, 1 = fullscreen */
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  /** Cierra con animación de contracción hacia la card */
  const handleClose = () => {
    progress.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  /* ── Handlers del flujo de swap ────────────────────────────────────────── */

  /** Activa el modo de selección de ejercicios a reemplazar. */
  const enterSwapMode = useCallback(() => {
    setSwapMode(true);
    setSelectedExercise(null);
    setSelectedForSwap(new Set());
    setSuggestions({});
    setPicks({});
    setLoadingItems(new Set());
    setSoftWarning(null);
    setBlockingWarning(null);
    setPendingMode(null);
    setActiveAiMode(false);
  }, [setSwapMode]);

  /** Sale del modo de cambio (reset completo). */
  const exitSwapMode = useCallback(() => {
    setSwapMode(false);
    setSelectedForSwap(new Set());
    setSuggestions({});
    setPicks({});
    setLoadingItems(new Set());
    setSoftWarning(null);
    setBlockingWarning(null);
    setPendingMode(null);
    setActiveAiMode(false);
  }, [setSwapMode]);

  /** Toggle de un ejercicio en la selección. No permite des-seleccionar uno ya con sugerencia lista. */
  const toggleExerciseSelection = useCallback((exerciseId: string) => {
    if (suggestions[exerciseId] || loadingItems.has(exerciseId)) return;
    setSelectedForSwap((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, [suggestions, loadingItems]);

  /** Lanza la solicitud de sugerencias para los ejercicios seleccionados. */
  const performRequestSuggestions = useCallback(async (useAI: boolean) => {
    const ids = Array.from(selectedForSwap);
    console.log('[RoutineDetailView] performRequestSuggestions start', { useAI, ids });
    if (ids.length === 0) {
      console.warn('[RoutineDetailView] performRequestSuggestions aborted: ids vacío');
      return;
    }

    setActiveAiMode(useAI);
    setLoadingItems(new Set(ids));
    // Los ítems pasan a estado loading; vacío selectedForSwap para que dejen de ser "checkbox"
    setSelectedForSwap(new Set());

    try {
      const token = await getToken();
      console.log('[RoutineDetailView] token obtenido, llamando getSwapSuggestions…');
      const response = await getSwapSuggestions(ids, useAI, token);
      console.log('[RoutineDetailView] response recibida', {
        suggestionsCount: response.suggestions.length,
        hasHealthWarning: response.hasHealthWarning,
        warningLevel: response.warningLevel,
      });

      // Mapeo sugerencias por routineExerciseId
      const map: Record<string, SwapSuggestionItem> = {};
      response.suggestions.forEach((s) => {
        map[s.replaces.routineExerciseId] = s;
      });

      setSuggestions((prev) => ({ ...prev, ...map }));
      setLoadingItems((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });

      // Manejo de warnings según severidad
      if (response.hasHealthWarning && response.warningLevel) {
        if (response.warningLevel === 'High') {
          setBlockingWarning({ warnings: response.warnings, level: response.warningLevel });
        } else {
          setSoftWarning({ warnings: response.warnings, level: response.warningLevel });
        }
      }
    } catch (error) {
      console.error('[RoutineDetailView] Error solicitando sugerencias:', error);
      // Revierto el estado loading: vuelven a quedar seleccionables
      setLoadingItems((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedForSwap((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [selectedForSwap, getToken]);

  /** Inicia el flujo de pedir sugerencias: muestra modal de confirmación primero. */
  const requestSuggestions = useCallback((useAI: boolean) => {
    console.log('[RoutineDetailView] requestSuggestions called', {
      useAI,
      selectedCount: selectedForSwap.size,
      selectedIds: Array.from(selectedForSwap),
    });
    if (selectedForSwap.size === 0) {
      console.warn('[RoutineDetailView] requestSuggestions aborted: ningún ejercicio seleccionado');
      return;
    }
    setPendingMode(useAI ? 'ai' : 'standard');
  }, [selectedForSwap]);

  /** Aplica los reemplazos elegidos: POST /swap-exercises. */
  const applySwaps = useCallback(async () => {
    const swaps = Object.entries(picks)
      .filter(([, newId]) => newId !== null)
      .map(([routineExerciseId, newExerciseId]) => ({
        routineExerciseId,
        newExerciseId: newExerciseId as string,
      }));
    console.log('[RoutineDetailView] applySwaps start', { swaps });

    if (swaps.length === 0) {
      console.log('[RoutineDetailView] applySwaps: nada que aplicar, salgo del modo');
      exitSwapMode();
      return;
    }

    setIsApplying(true);
    try {
      const token = await getToken();
      const updated = await confirmSwapExercises(swaps, token);
      console.log('[RoutineDetailView] applySwaps OK, rutina actualizada');
      onRoutineUpdated(updated);
      exitSwapMode();
    } catch (error) {
      console.error('[RoutineDetailView] Error aplicando swap:', error);
    } finally {
      setIsApplying(false);
    }
  }, [picks, getToken, onRoutineUpdated, exitSwapMode]);

  /* ── Wiring de acciones del FAB (MyTabBar) vía contexto ────────────────── */

  // Refs para mantener handlers estables y evitar reseteos del menú del FAB
  const handlersRef = useRef({ onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode, onEdit, onDelete, onActivate });
  handlersRef.current = { onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode, onEdit, onDelete, onActivate };

  useEffect(() => {
    setActions({
      onRegenerate: () => handlersRef.current.onRegenerate(),
      onChangeExercises: () => handlersRef.current.enterSwapMode(),
      onRequestSuggestions: (useAI: boolean) => handlersRef.current.requestSuggestions(useAI),
      onExitSwapMode: () => handlersRef.current.exitSwapMode(),
      onEdit: routine.source === 'Manual' ? (handlersRef.current.onEdit ?? null) : null,
      onDelete: handlersRef.current.onDelete ?? null,
      onActivate: !routine.isActive ? (handlersRef.current.onActivate ?? null) : null,
    });
    return () => setActions(null);
  }, [setActions]);

  /* ── Menú de opciones ───────────────────────────────────────────────────── */

  const menuItems = useMemo(() => {
    const close = () => setIsOptionsOpen(false);
    const swapHasActivity = loadingItems.size > 0 || Object.keys(suggestions).length > 0;
    if (isSwapMode) {
      return [
        ...(selectedForSwap.size > 0 || swapHasActivity ? [
          { icon: 'flash' as const,    label: 'Sugerencia automática', onPress: () => { close(); requestSuggestions(false); }, destructive: false },
          { icon: 'sparkles' as const, label: 'Sugerencia con IA',     onPress: () => { close(); requestSuggestions(true);  }, destructive: false },
        ] : []),
        { icon: 'close-circle' as const, label: 'Salir del modo editar', onPress: () => { close(); exitSwapMode(); }, destructive: true },
      ];
    }
    return [
      { icon: 'refresh' as const,         label: 'Regenerar rutina',   onPress: () => { close(); onRegenerate();  }, destructive: false },
      { icon: 'swap-horizontal' as const, label: 'Cambiar ejercicios', onPress: () => { close(); enterSwapMode(); }, destructive: false },
    ];
  }, [isSwapMode, selectedForSwap.size, loadingItems.size, suggestions, onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode]);

  /* ── Helpers de render ─────────────────────────────────────────────────── */

  /** Cantidad de ejercicios con sugerencia lista. */
  const readyCount = Object.keys(suggestions).length;
  /** Cantidad de ejercicios donde el usuario eligió un reemplazo. */
  const pickedCount = useMemo(
    () => Object.values(picks).filter((v) => v !== null).length,
    [picks],
  );
  /** Está activo algún sub-flujo de swap (loading o sugerencias listas). */
  const hasSwapActivity = loadingItems.size > 0 || readyCount > 0;

  /** Estilo animado del contenedor: interpola de card → fullscreen */
  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: interpolate(progress.value, [0, 1], [cardLayout.y, 0]),
    left: interpolate(progress.value, [0, 1], [cardLayout.x, 0]),
    width: interpolate(progress.value, [0, 1], [cardLayout.width, screenWidth]),
    height: interpolate(progress.value, [0, 1], [cardLayout.height, screenHeight]),
    borderRadius: interpolate(progress.value, [0, 1], [24, 0]),
    opacity: interpolate(progress.value, [0, 0.25], [0, 1], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
    zIndex: 40,
  }));

  /** El contenido interno aparece al abrir y desaparece al cerrar suavemente */
  const contentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
  }));

  const sortedDays = React.useMemo(() => {
    if (!routine?.days) return [];
    return [...routine.days].sort((a, b) => getDayWeight(a.day) - getDayWeight(b.day));
  }, [routine?.days]);

  if (sortedDays.length === 0) return null;

  const activeDay = sortedDays[activeDayIndex] || sortedDays[0];

  return (
    <Animated.View style={containerStyle} className="bg-slate-100 dark:bg-slate-950">
      {/* Fondo de transición: siempre oscuro */}
      <Animated.View
        style={contentOpacity}
        className="absolute inset-0 bg-slate-100 dark:bg-slate-950"
      />

      {/* Contenido con fade-in progresivo */}
      <Animated.View style={[{ flex: 1 }, contentOpacity]}>
        <DarkSheetLayout
          header={
            <>
              {/* Header: botón X + título centrado */}
              <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-3">
                <View className="items-end mb-3">
                  <TouchableOpacity onPress={handleClose} className="bg-slate-300 dark:bg-slate-700 w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="close" size={20} className='text-slate-900 dark:text-white' />
                  </TouchableOpacity>
                </View>
                <View className="items-center">
                  {isGenerating ? (
                    <>
                      <SkeletonItem className="w-48 h-7 rounded-md mb-2" />
                      <SkeletonItem className="w-32 h-4 rounded-md" />
                    </>
                  ) : (
                    <>
                      <Text className="dark:text-white text-2xl font-bold text-center">
                        {routine.name}
                      </Text>
                      <Text className="text-slate-400 text-sm mt-1 text-center">
                        Rutina de {sortedDays.length} días
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Selector de días */}
              {isGenerating ? (
                <View className="flex-row gap-3 px-4 pb-4">
                  <SkeletonItem className="w-20 h-9 rounded-full" />
                  <SkeletonItem className="w-20 h-9 rounded-full" />
                  <SkeletonItem className="w-20 h-9 rounded-full" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
                >
                  {sortedDays.map((day, index) => {
                    const isActive = activeDayIndex === index;
                    return (
                      <TouchableOpacity
                        key={day.id}
                        onPress={() => { setActiveDayIndex(index); setSelectedExercise(null); }}
                        className={`px-5 py-2 rounded-full border ${
                          isActive ? 'bg-lime-400 border-lime-400' : 'border-slate-400'
                        }`}
                      >
                        <Text className={`font-semibold text-sm ${isActive ? 'text-black' : 'text-slate-600 dark:text-slate-300'}`}>
                          {translateDay(day.day)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          }
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {isGenerating ? (
              <View className="px-4 py-4 gap-4" style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 80 }}>
                <SkeletonItem className="w-full h-24 rounded-2xl mb-2" />
                <SkeletonItem className="w-full h-28 rounded-2xl" />
                <SkeletonItem className="w-full h-28 rounded-2xl" />
                <SkeletonItem className="w-full h-28 rounded-2xl" />
              </View>
            ) : (
              <>
                {/* Banner de health warning suave (Medium/Low) */}
                {isSwapMode && softWarning && (
                  <View className={`mx-4 mt-4 rounded-2xl p-3 border flex-row items-start gap-2 ${
                    softWarning.level === 'Medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white border-slate-200'
                  }`}>
                    <Ionicons
                      name={softWarning.level === 'Medium' ? 'warning-outline' : 'information-circle-outline'}
                      size={18}
                      className={softWarning.level === 'Medium' ? 'text-amber-500' : 'text-slate-400'}
                    />
                    <View className="flex-1">
                      {softWarning.warnings.map((w, i) => (
                        <Text key={i} className="text-slate-700 text-xs leading-4">
                          {w.message}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Indicador de modo swap */}
                {isSwapMode && (
                  <View className="mx-4 mt-4 rounded-2xl p-3 bg-lime-400/10 border border-lime-400/30 flex-row items-center gap-2">
                    <Ionicons name="swap-horizontal" size={18} className="text-lime-600" />
                    <Text className="text-lime-700 text-xs font-semibold flex-1">
                      {readyCount > 0
                        ? 'Tocá los ejercicios con sugerencia lista para elegir el reemplazo.'
                        : 'Marcá los ejercicios que querés cambiar y presioná el botón para pedir sugerencias.'}
                    </Text>
                  </View>
                )}

                {/* Lista de ejercicios */}
                <View
                  className="px-4 pt-4"
                  style={{ paddingBottom: insets.bottom + BOTTOM_BAR_HEIGHT + 20 }}
                >
                  {activeDay.exercises.map((exercise, idx) => (
                    <SwapAwareExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      index={idx}
                      isSwapMode={isSwapMode}
                      isSelected={selectedForSwap.has(exercise.id)}
                      isLoading={loadingItems.has(exercise.id)}
                      suggestion={suggestions[exercise.id]}
                      pickExerciseId={picks[exercise.id]}
                      onPress={() => {
                        if (!isSwapMode) {
                          setSelectedExercise(exercise);
                          return;
                        }
                        if (suggestions[exercise.id]) {
                          setOpenCandidateFor(exercise.id);
                        } else {
                          toggleExerciseSelection(exercise.id);
                        }
                      }}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </DarkSheetLayout>

        {/* Bottom bar: Play/Aplicar + Opciones */}
        {!isGenerating && !readOnly && (
          <View
            className="absolute w-full px-4 z-10"
            style={{ bottom: insets.bottom + 8 }}
          >
            <View className="flex-row gap-3 items-center">
              {/* Botón principal: Play (normal) o Aplicar cambios (swap con picks) */}
              <TouchableOpacity
                className="flex-1 h-[60px] bg-slate-900 dark:bg-slate-950 rounded-full items-center justify-center"
                style={{ opacity: (isSwapMode && hasSwapActivity && pickedCount === 0) ? 0.45 : 1 }}
                disabled={isApplying || (isSwapMode && hasSwapActivity && pickedCount === 0)}
                onPress={() => {
                  if (isSwapMode && hasSwapActivity) {
                    applySwaps();
                  } else if (!isSwapMode) {
                    handleClose();
                    router.push({
                      pathname: '/session',
                      params: {
                        routineId: routine.id,
                        dayData: JSON.stringify(activeDay),
                      },
                    });
                  }
                }}
              >
                {isApplying ? (
                  <ActivityIndicator color="#a3e635" />
                ) : isSwapMode && hasSwapActivity ? (
                  <Ionicons name="checkmark" size={26} className="text-lime-400" />
                ) : (
                  <Ionicons name="play" size={26} className="text-lime-400" />
                )}
              </TouchableOpacity>

              {/* Botón de opciones */}
              <TouchableOpacity
                className="w-[60px] h-[60px] bg-slate-900 dark:bg-slate-950 rounded-full items-center justify-center"
                onPress={() => setIsOptionsOpen(true)}
              >
                <Ionicons name="ellipsis-horizontal" size={22} className="text-slate-50" />
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Dropdown de opciones — posicionado sobre el botón */}
        <Modal
          visible={isOptionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOptionsOpen(false)}
        >
          <Pressable
            className="flex-1"
            onPress={() => setIsOptionsOpen(false)}
          >
            <View
              className="absolute right-4 w-[230px] bg-slate-800 dark:bg-slate-700 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              style={{
                bottom: insets.bottom + 76,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  className={`flex-row items-center px-[18px] py-[15px] gap-[14px] ${i < menuItems.length - 1 ? 'border-b border-white/[0.07]' : ''}`}
                >
                  <Ionicons
                    name={item.icon}
                    size={19}
                    className={item.destructive ? 'text-red-400' : 'text-slate-400'}
                  />
                  <Text className={`text-[15px] font-medium ${item.destructive ? 'text-red-400' : 'text-slate-100'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Overlay interno de detalle de ejercicio */}
        {selectedExercise && (
          <ExerciseDetailView
            exercise={selectedExercise}
            onBack={() => setSelectedExercise(null)}
            onClose={() => {
              setSelectedExercise(null);
              handleClose();
            }}
          />
        )}

        {/* Modal de confirmación previa al request de sugerencias */}
        <ConfirmSuggestionsModal
          mode={pendingMode}
          count={selectedForSwap.size}
          onCancel={() => setPendingMode(null)}
          onConfirm={() => {
            const useAI = pendingMode === 'ai';
            setPendingMode(null);
            performRequestSuggestions(useAI);
          }}
        />

        {/* Modal bloqueante para warnings de severidad High */}
        <BlockingWarningModal
          payload={blockingWarning}
          onAcknowledge={() => setBlockingWarning(null)}
        />

        {/* Modal de selección de candidato */}
        <SwapCandidateModal
          suggestion={openCandidateFor ? suggestions[openCandidateFor] ?? null : null}
          currentPickExerciseId={openCandidateFor !== null ? picks[openCandidateFor] : undefined}
          isAiMode={activeAiMode}
          onClose={() => setOpenCandidateFor(null)}
          onPick={(candidate) => {
            if (!openCandidateFor) return;
            setPicks((prev) => ({
              ...prev,
              [openCandidateFor]: candidate ? candidate.exerciseId : null,
            }));
            setOpenCandidateFor(null);
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                        Sub-componentes auxiliares                            */
/* ──────────────────────────────────────────────────────────────────────────── */

interface SwapAwareExerciseItemProps {
  exercise: RoutineExercise;
  index: number;
  isSwapMode: boolean;
  isSelected: boolean;
  isLoading: boolean;
  suggestion?: SwapSuggestionItem;
  pickExerciseId: string | null | undefined;
  onPress: () => void;
}

/**
 * Item de ejercicio con awareness del modo swap:
 * - Modo normal: tarjeta estándar
 * - Modo swap selección: muestra check + borde resaltado al seleccionar
 * - Modo swap loading: borde pulsante + label "Realizando sugerencia"
 * - Modo swap ready: borde lima + label "Sugerencia Lista" o nombre del reemplazo elegido
 */
const SwapAwareExerciseItem: React.FC<SwapAwareExerciseItemProps> = ({
  exercise,
  index,
  isSwapMode,
  isSelected,
  isLoading,
  suggestion,
  pickExerciseId,
  onPress,
}) => {
  /** Pulso del borde mientras carga */
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (isLoading) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
  }));

  const isReady = !!suggestion;
  const hasPickedReplacement = isReady && pickExerciseId !== null && pickExerciseId !== undefined;
  const pickedCandidate = hasPickedReplacement
    ? suggestion!.candidates.find((c) => c.exerciseId === pickExerciseId)
    : null;

  // Color del borde según estado
  const baseBorder = 'border-zinc-200 dark:border-white/10';
  const selectedBorder = 'border-lime-400';
  const readyBorder = 'border-lime-400';
  const loadingBorder = 'border-lime-400';

  const borderClass = isLoading
    ? loadingBorder
    : isReady
      ? readyBorder
      : isSelected
        ? selectedBorder
        : baseBorder;

  return (
    <View className="relative mb-3">
      {/* Borde pulsante para estado loading (overlay animado) */}
      {isLoading && (
        <Animated.View
          pointerEvents="none"
          style={pulseStyle}
          className="absolute inset-0 rounded-2xl border-2 border-lime-400 z-10"
        />
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`flex-row bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 border items-center ${borderClass}`}
      >
        {/* Número en círculo lime sólido */}
        <View className="w-8 h-8 rounded-full bg-lime-400 items-center justify-center mr-3 shrink-0">
          <Text className="text-slate-900 text-xs font-bold">{index + 1}</Text>
        </View>

        {/* Imagen / GIF */}
        {(pickedCandidate?.gifUrl ?? exercise.gifUrl) ? (
          <Image
            source={{ uri: (pickedCandidate?.gifUrl ?? exercise.gifUrl) as string }}
            className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl mr-3"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl items-center justify-center mr-3">
            <Ionicons name="image-outline" size={22} className="text-slate-400" />
          </View>
        )}

        <View className="flex-1">
          <Text
            className={`font-bold text-base mb-1 ${
              pickedCandidate ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-50'
            }`}
            numberOfLines={2}
          >
            {exercise.name}
          </Text>

          {/* Sub-línea: cambia según estado */}
          {isLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#a3e635" />
              <Text className="text-zinc-900 dark:text-lime-300 text-xs font-semibold">
                Realizando sugerencia…
              </Text>
            </View>
          ) : isReady && pickedCandidate ? (
            <Text className="text-zinc-900 dark:text-lime-300 text-xs font-semibold" numberOfLines={1}>
              → {pickedCandidate.name}
            </Text>
          ) : isReady ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={12} className="text-zinc-900 dark:text-lime-300" />
              <Text className="text-zinc-900 dark:text-lime-300 text-xs font-semibold">
                Sugerencia Lista — tocá para elegir
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center flex-wrap gap-3">
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.sets}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="repeat-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{formatReps(exercise)}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.rest}</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="weight" size={12} className="text-zinc-900 dark:text-lime-300" />
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.weight}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Indicador a la derecha según estado */}
        {isSwapMode ? (
          isLoading ? null : isReady ? (
            <Ionicons
              name={hasPickedReplacement ? 'checkmark-circle' : 'sparkles'}
              size={22}
              className="text-lime-500"
            />
          ) : (
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isSelected ? 'bg-lime-400 border-lime-400' : 'border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {isSelected && <Ionicons name="checkmark" size={14} className="text-black" />}
            </View>
          )
        ) : (
          <Ionicons name="chevron-forward" size={20} className="text-zinc-400 dark:text-zinc-500" />
        )}
      </TouchableOpacity>
    </View>
  );
};

/* ── Modal de confirmación previa a pedir sugerencias ────────────────────── */

interface ConfirmSuggestionsModalProps {
  mode: 'standard' | 'ai' | null;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmSuggestionsModal: React.FC<ConfirmSuggestionsModalProps> = ({
  mode,
  count,
  onCancel,
  onConfirm,
}) => {
  const visible = mode !== null;
  const isAi = mode === 'ai';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
          <View className="items-center mb-4">
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
              isAi ? 'bg-purple-500/15' : 'bg-lime-500/15'
            }`}>
              <Ionicons
                name={isAi ? 'sparkles' : 'swap-horizontal'}
                size={28}
                className={isAi ? 'text-purple-500' : 'text-lime-500'}
              />
            </View>
            <Text className="text-zinc-900 dark:text-white text-xl font-bold text-center">
              {isAi ? 'Sugerencias con IA' : 'Sugerencias automáticas'}
            </Text>
          </View>

          <Text className="text-zinc-600 dark:text-zinc-400 text-sm leading-5 mb-6 text-center">
            Vas a solicitar reemplazos para{' '}
            <Text className="font-bold text-zinc-900 dark:text-white">{count}</Text>{' '}
            {count === 1 ? 'ejercicio' : 'ejercicios'}.
            {isAi
              ? ' La IA analizará tu perfil y elegirá los mejores candidatos. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'
              : ' Vamos a buscar reemplazos compatibles con tu equipamiento y condiciones de salud. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'}
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center"
            >
              <Text className="text-zinc-900 dark:text-white font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 py-3 rounded-2xl items-center ${
                isAi ? 'bg-purple-500' : 'bg-lime-300'
              }`}
            >
              <Text className={`font-semibold ${isAi ? 'text-white' : 'text-black'}`}>
                Continuar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ── Modal bloqueante para warnings High ─────────────────────────────────── */

interface BlockingWarningModalProps {
  payload: { warnings: HealthWarning[]; level: WarningLevel } | null;
  onAcknowledge: () => void;
}

const BlockingWarningModal: React.FC<BlockingWarningModalProps> = ({ payload, onAcknowledge }) => {
  const visible = !!payload;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAcknowledge}>
      <View className="flex-1 bg-black/70 items-center justify-center p-6">
        <View className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6">
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-red-500/15 items-center justify-center mb-3">
              <Ionicons name="warning" size={30} className="text-red-500" />
            </View>
            <Text className="text-zinc-900 dark:text-white text-xl font-bold text-center">
              Atención: condiciones de salud
            </Text>
          </View>

          <ScrollView className="mb-6 max-h-60">
            {payload?.warnings.map((w, i) => (
              <View key={i} className="mb-3">
                <Text className="text-zinc-900 dark:text-white font-semibold text-sm mb-1">
                  {w.condition}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-400 text-xs leading-5">
                  {w.message}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={onAcknowledge}
            className="py-3 rounded-2xl bg-red-500 items-center"
          >
            <Text className="text-white font-semibold">Entendido, ver sugerencias</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
