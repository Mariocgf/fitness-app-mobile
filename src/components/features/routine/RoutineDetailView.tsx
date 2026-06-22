import { AdaptRoutineModal } from '@/src/components/features/routine/AdaptRoutineModal';
import { ExerciseDetailView } from '@/src/components/features/routine/ExerciseDetailView';
import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
import { RoutineEditMode } from '@/src/components/features/routine/RoutineEditMode';
import { SwapCandidateModal } from '@/src/components/features/routine/SwapCandidateModal';
import {
  BOTTOM_BUTTON_HEIGHT,
  DaySlot,
  SLOT_CONFIGS,
  TAB_BAR_HEIGHT,
} from '@/src/components/features/routine/routine-detail-shared';
import { translateDay } from '@/src/i18n';
import { confirmSwapExercises, getSwapSuggestions } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { HealthWarning, Routine, RoutineDay, RoutineExercise, SwapSuggestionItem, WarningLevel } from '@/src/types/routine';
import { formatReps } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

const SkeletonItem = ({ className }: { className?: string }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={animStyle} className={`bg-zinc-800 ${className}`} />;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList<RoutineDay>;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const getDayWeight = (dayLabel: string): number => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const idx = days.findIndex(d => dayLabel.toLowerCase().includes(d));
  return idx !== -1 ? idx : 99;
};

const getDayDisplayName = (dayLabel: string): string => {
  const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const key = keys.find(k => dayLabel.toLowerCase().includes(k));
  return key ? translateDay(key) : dayLabel;
};

const buildSortedDays = (days: RoutineDay[]): RoutineDay[] =>
  [...days].sort((a, b) => getDayWeight(a.day) - getDayWeight(b.day));

const getTodayIndex = (sorted: RoutineDay[]): number => {
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayKeys[new Date().getDay()];
  const idx = sorted.findIndex(d => d.day.toLowerCase().includes(todayKey));
  return idx !== -1 ? idx : 0;
};

/** Formatea las repeticiones, incluyendo rango min–max cuando aplica */
const getExerciseReps = (exercise: RoutineExercise): string => {
  if (exercise.repType === 'Timed') return formatReps(exercise);
  if (exercise.minRep && exercise.maxRep && exercise.minRep !== exercise.maxRep) {
    return `${exercise.minRep}–${exercise.maxRep}`;
  }
  return exercise.currentRep ?? exercise.minRep ?? '-';
};

/* ── Tipos exportados ─────────────────────────────────────────────────────── */

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
  /** Oculta el botón de acción principal. */
  readOnly?: boolean;
  onRegenerate: () => void;
  onRoutineUpdated: (routine: Routine) => void;
  onDelete?: () => void;
  onActivate?: () => void;
}

/* ── Componente principal ─────────────────────────────────────────────────── */

export const RoutineDetailView: React.FC<RoutineDetailViewProps> = ({
  routine,
  onClose,
  cardLayout,
  isGenerating = false,
  readOnly = false,
  onRegenerate,
  onRoutineUpdated,
  onDelete,
  onActivate,
}) => {
  const sortedDays = useMemo(
    () => (routine?.days ? buildSortedDays(routine.days) : []),
    [routine?.days],
  );

  // Arranca en el día de hoy sin necesidad de un effect posterior
  const [activeDayIndex, setActiveDayIndex] = useState(() =>
    getTodayIndex(routine?.days ? buildSortedDays(routine.days) : []),
  );
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isAdaptModalOpen, setIsAdaptModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { isSwapMode, setSwapMode, setActions } = useRoutineDetailContext();
  const flatListRef = useRef<FlatList<RoutineDay>>(null);
  // Ref para leer el índice activo dentro del gesture handler (evita recrear el gesto en cada cambio)
  const activeDayIndexRef = useRef(activeDayIndex);
  activeDayIndexRef.current = activeDayIndex;

  /** Cambia el día activo y sincroniza el FlatList de ejercicios */
  const goToDay = useCallback((index: number) => {
    setActiveDayIndex(index);
    setSelectedExercise(null);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  /** Gesto horizontal en la zona del día: swipe circular */
  const dayHeaderGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-20, 20])
      .runOnJS(true)
      .onEnd(e => {
        const total = sortedDays.length;
        if (!total) return;
        if (e.translationX < -50 || e.velocityX < -400) {
          goToDay((activeDayIndexRef.current + 1) % total);
        } else if (e.translationX > 50 || e.velocityX > 400) {
          goToDay((activeDayIndexRef.current - 1 + total) % total);
        }
      }),
  // sortedDays.length y goToDay son estables durante el ciclo de vida de la vista
  [sortedDays.length, goToDay],
  );

  /* ── Estado del flujo de swap ─────────────────────────────────────────── */

  const [selectedForSwap, setSelectedForSwap] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Record<string, SwapSuggestionItem>>({});
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const [activeAiMode, setActiveAiMode] = useState(false);
  const [pendingMode, setPendingMode] = useState<'standard' | 'ai' | null>(null);
  const [blockingWarning, setBlockingWarning] = useState<{ warnings: HealthWarning[]; level: WarningLevel } | null>(null);
  const [softWarning, setSoftWarning] = useState<{ warnings: HealthWarning[]; level: WarningLevel } | null>(null);
  const [openCandidateFor, setOpenCandidateFor] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  /* ── Scroll compartido para animar el header de días ─────────────────── */

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scrollX = useSharedValue(
    getTodayIndex(routine?.days ? buildSortedDays(routine.days) : []) * screenWidth,
  );
  const baseOffset = useSharedValue(activeDayIndex * screenWidth);

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollX.value = e.contentOffset.x;
  });

  /* ── Animación expand / collapse ─────────────────────────────────────── */

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    baseOffset.value = activeDayIndex * screenWidth;
  }, [activeDayIndex, screenWidth]);

  const handleClose = () => {
    progress.value = withTiming(
      0,
      { duration: 300, easing: Easing.in(Easing.cubic) },
      (finished) => { if (finished) runOnJS(onClose)(); },
    );
  };

  /* ── Handlers del swap ────────────────────────────────────────────────── */

  const resetSwapState = useCallback(() => {
    setSelectedForSwap(new Set());
    setSuggestions({});
    setPicks({});
    setLoadingItems(new Set());
    setSoftWarning(null);
    setBlockingWarning(null);
    setPendingMode(null);
    setActiveAiMode(false);
  }, []);

  const enterSwapMode = useCallback(() => {
    setSwapMode(true);
    setSelectedExercise(null);
    resetSwapState();
  }, [setSwapMode, resetSwapState]);

  const exitSwapMode = useCallback(() => {
    setSwapMode(false);
    resetSwapState();
  }, [setSwapMode, resetSwapState]);

  const toggleExerciseSelection = useCallback((exerciseId: string) => {
    if (suggestions[exerciseId] || loadingItems.has(exerciseId)) return;
    setSelectedForSwap(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, [suggestions, loadingItems]);

  const performRequestSuggestions = useCallback(async (useAI: boolean) => {
    const ids = Array.from(selectedForSwap);
    if (ids.length === 0) return;
    setActiveAiMode(useAI);
    setLoadingItems(new Set(ids));
    setSelectedForSwap(new Set());
    try {
      const token = await getToken();
      const response = await getSwapSuggestions(ids, useAI, token);
      const map: Record<string, SwapSuggestionItem> = {};
      response.suggestions.forEach(s => { map[s.replaces.routineExerciseId] = s; });
      setSuggestions(prev => ({ ...prev, ...map }));
      setLoadingItems(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      if (response.hasHealthWarning && response.warningLevel) {
        if (response.warningLevel === 'High') {
          setBlockingWarning({ warnings: response.warnings, level: response.warningLevel });
        } else {
          setSoftWarning({ warnings: response.warnings, level: response.warningLevel });
        }
      }
    } catch {
      setLoadingItems(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      setSelectedForSwap(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
    }
  }, [selectedForSwap, getToken]);

  const requestSuggestions = useCallback((useAI: boolean) => {
    if (selectedForSwap.size === 0) return;
    setPendingMode(useAI ? 'ai' : 'standard');
  }, [selectedForSwap]);

  const applySwaps = useCallback(async () => {
    const swaps = Object.entries(picks)
      .filter(([, newId]) => newId !== null)
      .map(([routineExerciseId, newExerciseId]) => ({
        routineExerciseId,
        newExerciseId: newExerciseId as string,
      }));
    if (swaps.length === 0) { exitSwapMode(); return; }
    setIsApplying(true);
    try {
      const token = await getToken();
      const updated = await confirmSwapExercises(swaps, token);
      onRoutineUpdated(updated);
      exitSwapMode();
    } catch { /* el service loguea el error */ }
    finally { setIsApplying(false); }
  }, [picks, getToken, onRoutineUpdated, exitSwapMode]);

  /* ── Wiring de acciones del contexto ─────────────────────────────────── */

  const openAdaptModal = useCallback(() => setIsAdaptModalOpen(true), []);
  const handlersRef = useRef({
    onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode,
    onDelete, onActivate, onAdaptRoutine: openAdaptModal,
  });
  handlersRef.current = {
    onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode,
    onDelete, onActivate, onAdaptRoutine: openAdaptModal,
  };

  useEffect(() => {
    setActions({
      onRegenerate: () => handlersRef.current.onRegenerate(),
      onChangeExercises: () => handlersRef.current.enterSwapMode(),
      onRequestSuggestions: useAI => handlersRef.current.requestSuggestions(useAI),
      onExitSwapMode: () => handlersRef.current.exitSwapMode(),
      onEdit: routine.source === 'Manual' ? () => setIsEditMode(true) : null,
      onDelete: handlersRef.current.onDelete ?? null,
      onActivate: !routine.isActive ? (handlersRef.current.onActivate ?? null) : null,
      onAdaptRoutine: routine.source === 'Manual' ? () => handlersRef.current.onAdaptRoutine() : null,
    });
    return () => setActions(null);
  }, [setActions]);

  /* ── Derivados ────────────────────────────────────────────────────────── */

  const readyCount = Object.keys(suggestions).length;
  const pickedCount = useMemo(
    () => Object.values(picks).filter(v => v !== null).length,
    [picks],
  );
  const hasSwapActivity = loadingItems.size > 0 || readyCount > 0;

  /* ── Opciones del menú "···" ──────────────────────────────────────────── */

  const menuItems = useMemo(() => {
    const close = () => setIsOptionsOpen(false);
    const swapHasActivity = loadingItems.size > 0 || Object.keys(suggestions).length > 0;

    if (isSwapMode) {
      return [
        ...(selectedForSwap.size > 0 || swapHasActivity ? [
          {
            icon: 'flash' as const,
            label: 'Sugerencia automática',
            onPress: () => { close(); requestSuggestions(false); },
            destructive: false,
          },
          {
            icon: 'sparkles' as const,
            label: 'Sugerencia con IA',
            onPress: () => { close(); requestSuggestions(true); },
            destructive: false,
          },
        ] : []),
        {
          icon: 'close-circle' as const,
          label: 'Salir del modo editar',
          onPress: () => { close(); exitSwapMode(); },
          destructive: true,
        },
      ];
    }

    const items: {
      icon: React.ComponentProps<typeof Ionicons>['name'];
      label: string;
      onPress: () => void;
      destructive: boolean;
    }[] = [
      {
        icon: 'refresh',
        label: 'Regenerar rutina',
        onPress: () => { close(); onRegenerate(); },
        destructive: false,
      },
      {
        icon: 'swap-horizontal',
        label: 'Cambiar ejercicios',
        onPress: () => { close(); enterSwapMode(); },
        destructive: false,
      },
    ];

    if (routine.source === 'Manual') {
      items.push({
        icon: 'sparkles',
        label: 'Adaptar con IA',
        onPress: () => { close(); openAdaptModal(); },
        destructive: false,
      });
      items.push({
        icon: 'create-outline',
        label: 'Editar rutina',
        onPress: () => { close(); setIsEditMode(true); },
        destructive: false,
      });
    }

    if (onActivate && !routine.isActive) {
      items.push({
        icon: 'checkmark-circle-outline',
        label: 'Activar rutina',
        onPress: () => { close(); onActivate(); },
        destructive: false,
      });
    }

    if (onDelete) {
      items.push({
        icon: 'trash-outline',
        label: 'Eliminar rutina',
        onPress: () => { close(); onDelete(); },
        destructive: true,
      });
    }

    return items;
  }, [
    isSwapMode, selectedForSwap.size, loadingItems.size, suggestions,
    onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode,
    routine.source, routine.isActive, onActivate, onDelete, openAdaptModal,
  ]);

  /* ── Estilos animados ─────────────────────────────────────────────────── */

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

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
  }));

  if (sortedDays.length === 0) return null;

  const activeDay = sortedDays[activeDayIndex] ?? sortedDays[0];

  const getItemLayout = (_: unknown, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <Animated.View style={containerStyle} className="bg-zinc-950">
      {isEditMode ? (
        <RoutineEditMode
          routine={routine}
          onExit={() => setIsEditMode(false)}
          onRoutineUpdated={(updated) => { onRoutineUpdated(updated); setIsEditMode(false); }}
        />
      ) : (
      <Animated.View style={[{ flex: 1 }, contentOpacity]}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View
          className="flex-row items-center px-4"
          style={{ paddingTop: insets.top + 12, paddingBottom: 8 }}
        >
          <TouchableOpacity
            onPress={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} className="text-white" />
          </TouchableOpacity>

          <Text
            className="flex-1 text-white text-base font-semibold text-center mx-3"
            numberOfLines={1}
          >
            {isGenerating ? '···' : routine.name}
          </Text>

          {!readOnly ? (
            <TouchableOpacity
              onPress={() => setIsOptionsOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
            >
              <Ionicons name="ellipsis-horizontal" size={20} className="text-white" />
            </TouchableOpacity>
          ) : (
            <View className="w-9" />
          )}
        </View>

        {/* ── Sección del día (swipeable, circular) ─────────────────────── */}
        {isGenerating ? (
          <View className="px-6 pt-2 pb-4 gap-3">
            <SkeletonItem className="w-52 h-14 rounded-xl" />
            <SkeletonItem className="w-40 h-4 rounded-md" />
          </View>
        ) : (
          <GestureDetector gesture={dayHeaderGesture}>
            <View className="px-6 pt-1 pb-4">
              {/* 3 slots fijos: el contenido hace cross-fade al deslizar */}
              <View className="flex-row items-baseline gap-6">
                {SLOT_CONFIGS.slice(0, Math.min(3, sortedDays.length)).map((cfg, slotIdx) => {
                  const N = sortedDays.length;
                  const i = activeDayIndex + slotIdx;
                  const getN = (idx: number) =>
                    idx >= 0 && idx < N ? getDayDisplayName(sortedDays[idx].day) : '';
                  return (
                    <DaySlot
                      key={slotIdx}
                      prev={getN(i - 1)}
                      current={getN(i)}
                      next={getN(i + 1)}
                      fontSize={cfg.fontSize}
                      color={cfg.color}
                      scrollX={scrollX}
                      baseOffset={baseOffset}
                      screenWidth={screenWidth}
                    />
                  );
                })}
              </View>
              <Text className="text-zinc-500 text-sm mt-0.5">
                {activeDay.exercises.length}{' '}
                {activeDay.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}{' '}
                • {activeDay.approxTimeSession}
              </Text>
            </View>
          </GestureDetector>
        )}

        {/* ── Banners del modo swap ──────────────────────────────────────── */}
        {isSwapMode && softWarning && (
          <View
            className={`mx-4 mb-2 rounded-2xl p-3 border flex-row items-start gap-2 ${
              softWarning.level === 'Medium'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <Ionicons
              name={softWarning.level === 'Medium' ? 'warning-outline' : 'information-circle-outline'}
              size={18}
              className={softWarning.level === 'Medium' ? 'text-amber-500' : 'text-zinc-400'}
            />
            <View className="flex-1">
              {softWarning.warnings.map((w, i) => (
                <Text key={i} className="text-zinc-300 text-xs leading-4">{w.message}</Text>
              ))}
            </View>
          </View>
        )}

        {isSwapMode && (
          <View className="mx-4 mb-2 rounded-2xl p-3 bg-lime-400/10 border border-lime-400/30 flex-row items-center gap-2">
            <Ionicons name="swap-horizontal" size={18} className="text-lime-500" />
            <Text className="text-lime-400 text-xs font-semibold flex-1">
              {readyCount > 0
                ? 'Tocá los ejercicios con sugerencia lista para elegir el reemplazo.'
                : 'Marcá los ejercicios que querés cambiar y usá "···" para pedir sugerencias.'}
            </Text>
          </View>
        )}

        {/* ── Lista de ejercicios paginada por día ──────────────────────── */}
        {isGenerating ? (
          <View className="flex-1 px-4 gap-3 pt-1">
            {[1, 2, 3, 4].map(i => (
              <SkeletonItem key={i} className="w-full h-20 rounded-2xl" />
            ))}
          </View>
        ) : (
          <AnimatedFlatList
            ref={flatListRef}
            data={sortedDays}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={day => day.id}
            getItemLayout={getItemLayout}
            initialScrollIndex={activeDayIndex}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            onMomentumScrollEnd={e => {
              // El FlatList ya realizó el scroll; solo actualizamos el índice
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              if (idx !== activeDayIndex) {
                setActiveDayIndex(idx);
                setSelectedExercise(null);
              }
            }}
            renderItem={({ item: day }: { item: RoutineDay }) => (
              <ScrollView
                style={{ width: screenWidth }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 4,
                  paddingBottom: insets.bottom + TAB_BAR_HEIGHT + BOTTOM_BUTTON_HEIGHT + 32,
                }}
              >
                {day.exercises.map((exercise, idx) => (
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
              </ScrollView>
            )}
          />
        )}

        {/* ── Botón principal ────────────────────────────────────────────── */}
        {!isGenerating && !readOnly && (
          <View
            className="absolute w-full px-4"
            style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
          >
            <TouchableOpacity
              className="w-full h-[60px] bg-white rounded-2xl items-center justify-center"
              style={{ opacity: isSwapMode && hasSwapActivity && pickedCount === 0 ? 0.45 : 1 }}
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
                      routineName: routine.name,
                      nextSessionDay: sortedDays[(activeDayIndex + 1) % sortedDays.length]?.day ?? '',
                    },
                  });
                }
              }}
            >
              {isApplying ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-zinc-900 font-bold text-base">
                  {isSwapMode && hasSwapActivity ? 'Aplicar cambios' : 'Comenzar rutina'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Dropdown de opciones ──────────────────────────────────────── */}
        <Modal
          visible={isOptionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOptionsOpen(false)}
        >
          <Pressable className="flex-1" onPress={() => setIsOptionsOpen(false)}>
            <View
              className="absolute right-4 w-[240px] bg-zinc-800 border border-white/10 rounded-2xl overflow-hidden"
              style={{
                top: insets.top + 56,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  className={`flex-row items-center px-[18px] py-[15px] gap-[14px] ${
                    i < menuItems.length - 1 ? 'border-b border-white/[0.07]' : ''
                  }`}
                >
                  <Ionicons
                    name={item.icon}
                    size={19}
                    className={item.destructive ? 'text-red-400' : 'text-zinc-400'}
                  />
                  <Text
                    className={`text-[15px] font-medium ${
                      item.destructive ? 'text-red-400' : 'text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* ── Overlay de detalle de ejercicio ──────────────────────────── */}
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

        {/* ── Modales del flujo de swap ─────────────────────────────────── */}
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

        <BlockingWarningModal
          payload={blockingWarning}
          onAcknowledge={() => setBlockingWarning(null)}
        />

        <SwapCandidateModal
          suggestion={openCandidateFor ? suggestions[openCandidateFor] ?? null : null}
          currentPickExerciseId={openCandidateFor !== null ? picks[openCandidateFor] : undefined}
          isAiMode={activeAiMode}
          onClose={() => setOpenCandidateFor(null)}
          onPick={candidate => {
            if (!openCandidateFor) return;
            setPicks(prev => ({
              ...prev,
              [openCandidateFor]: candidate ? candidate.exerciseId : null,
            }));
            setOpenCandidateFor(null);
          }}
        />

        <AdaptRoutineModal
          visible={isAdaptModalOpen}
          routineId={routine.id}
          routineName={routine.name}
          onClose={() => setIsAdaptModalOpen(false)}
          onRoutineUpdated={onRoutineUpdated}
        />
      </Animated.View>
      )}
    </Animated.View>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                          Card de ejercicio                                   */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Columna de stat: label gris arriba, valor blanco en negrita abajo */
const StatCol = ({ label, value }: { label: string; value: string }) => (
  <View className="items-center" style={{ minWidth: 36 }}>
    <Text className="text-zinc-500 text-[10px] mb-0.5">{label}</Text>
    <Text className="text-white font-bold text-sm" numberOfLines={1}>{value}</Text>
  </View>
);

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
 * Card de ejercicio con awareness del modo swap.
 * Vista normal: número | imagen | nombre + stats (Sets/Reps/Rest).
 * Modo swap: checkbox / loading / sugerencia lista / reemplazo elegido.
 * Los puntos de drag & drop solo se muestran en el editor de rutinas.
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
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (isLoading) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
  }));

  const isReady = !!suggestion;
  const hasPickedReplacement = isReady && pickExerciseId != null;
  const pickedCandidate = hasPickedReplacement
    ? suggestion!.candidates.find(c => c.exerciseId === pickExerciseId)
    : null;

  const gifUrl = (pickedCandidate?.gifUrl ?? exercise.gifUrl) as string | null;

  const borderClass =
    isLoading || isReady || isSelected ? 'border-lime-400' : 'border-white/10';

  return (
    <View className="relative mb-3">
      {/* Borde pulsante mientras carga */}
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
        className={`flex-row bg-zinc-900 rounded-2xl border items-center gap-3 p-3 ${borderClass}`}
      >
        {/* Número de orden */}
        <Text className="text-zinc-600 font-bold text-sm w-5 text-center">
          {index + 1}
        </Text>

        {/* GIF / imagen */}
        <ExerciseThumbnail uri={gifUrl} size={64} />

        {/* Nombre + sub-línea de estado en swap */}
        <View className="flex-1">
          <Text
            className={`font-bold text-sm mb-0.5 ${
              pickedCandidate ? 'text-zinc-500 line-through' : 'text-white'
            }`}
            numberOfLines={2}
          >
            {exercise.name}
          </Text>

          {/* Sub-líneas en modo swap */}
          {isLoading && (
            <View className="flex-row items-center gap-1.5">
              <ActivityIndicator size="small" color="#a3e635" />
              <Text className="text-lime-400 text-xs font-semibold">
                Buscando sugerencia…
              </Text>
            </View>
          )}

          {!isLoading && isReady && pickedCandidate && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="arrow-forward" size={12} className="text-lime-400" />
              <Text className="text-lime-400 text-xs font-semibold" numberOfLines={1}>
                {pickedCandidate.name}
              </Text>
            </View>
          )}

          {!isLoading && isReady && !pickedCandidate && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={12} className="text-lime-400" />
              <Text className="text-lime-400 text-xs font-semibold">
                Sugerencia lista — tocá para elegir
              </Text>
            </View>
          )}
        </View>

        {/* Lado derecho: stats (modo normal) o indicador swap */}
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
                isSelected ? 'bg-lime-400 border-lime-400' : 'border-zinc-600'
              }`}
            >
              {isSelected && <Ionicons name="checkmark" size={14} className="text-black" />}
            </View>
          )
        ) : (
          <View className="flex-row gap-4">
            <StatCol label="Sets" value={exercise.sets} />
            <StatCol label="Reps" value={getExerciseReps(exercise)} />
            <StatCol label="Rest" value={exercise.rest} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*                     Modal de confirmación previa al swap                     */
/* ──────────────────────────────────────────────────────────────────────────── */

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
  const isAi = mode === 'ai';
  return (
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-6">
          <View className="items-center mb-4">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                isAi ? 'bg-purple-500/15' : 'bg-lime-500/15'
              }`}
            >
              <Ionicons
                name={isAi ? 'sparkles' : 'swap-horizontal'}
                size={28}
                className={isAi ? 'text-purple-500' : 'text-lime-500'}
              />
            </View>
            <Text className="text-white text-xl font-bold text-center">
              {isAi ? 'Sugerencias con IA' : 'Sugerencias automáticas'}
            </Text>
          </View>

          <Text className="text-zinc-400 text-sm leading-5 mb-6 text-center">
            Vas a solicitar reemplazos para{' '}
            <Text className="font-bold text-white">{count}</Text>{' '}
            {count === 1 ? 'ejercicio' : 'ejercicios'}.
            {isAi
              ? ' La IA analizará tu perfil y elegirá los mejores candidatos. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'
              : ' Vamos a buscar reemplazos compatibles con tu equipamiento y condiciones de salud. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'}
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-2xl bg-zinc-800 items-center"
            >
              <Text className="text-white font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 py-3 rounded-2xl items-center ${isAi ? 'bg-purple-500' : 'bg-lime-400'}`}
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*                   Modal bloqueante para warnings High                        */
/* ──────────────────────────────────────────────────────────────────────────── */

interface BlockingWarningModalProps {
  payload: { warnings: HealthWarning[]; level: WarningLevel } | null;
  onAcknowledge: () => void;
}

const BlockingWarningModal: React.FC<BlockingWarningModalProps> = ({ payload, onAcknowledge }) => (
  <Modal visible={!!payload} transparent animationType="fade" onRequestClose={onAcknowledge}>
    <View className="flex-1 bg-black/70 items-center justify-center p-6">
      <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-6">
        <View className="items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-red-500/15 items-center justify-center mb-3">
            <Ionicons name="warning" size={30} className="text-red-500" />
          </View>
          <Text className="text-white text-xl font-bold text-center">
            Atención: condiciones de salud
          </Text>
        </View>

        <ScrollView className="mb-6 max-h-60">
          {payload?.warnings.map((w, i) => (
            <View key={i} className="mb-3">
              <Text className="text-white font-semibold text-sm mb-1">{w.condition}</Text>
              <Text className="text-zinc-400 text-xs leading-5">{w.message}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={onAcknowledge} className="py-3 rounded-2xl bg-red-500 items-center">
          <Text className="text-white font-semibold">Entendido, ver sugerencias</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);
