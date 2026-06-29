import { AdaptRoutineModal } from '@/src/components/features/routine/AdaptRoutineModal';
import { ExerciseDetailView } from '@/src/components/features/routine/ExerciseDetailView';
import { BlockingWarningModal } from '@/src/components/features/routine/BlockingWarningModal';
import { ConfirmSuggestionsModal } from '@/src/components/features/routine/ConfirmSuggestionsModal';
import { RoutineEditMode } from '@/src/components/features/routine/RoutineEditMode';
import { SwapAwareExerciseItem } from '@/src/components/features/routine/SwapAwareExerciseItem';
import { SwapCandidateModal } from '@/src/components/features/routine/SwapCandidateModal';
import {
  BOTTOM_BUTTON_HEIGHT,
  DaySlot,
  SLOT_CONFIGS,
  TAB_BAR_HEIGHT,
  VersionBadge,
} from '@/src/components/features/routine/routine-detail-shared';
import { RoutineVersionsSheet } from '@/src/components/features/routine/RoutineVersionsSheet';
import { translateDay } from '@/src/i18n';
import {
  confirmSwapExercises,
  getRoutineVersionDetail,
  getSwapSuggestions,
  restoreRoutineVersion,
  setActiveRoutineVersion,
} from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { HealthWarning, Routine, RoutineDay, RoutineExercise, RoutineVersionDetail, RoutineVersionSummary, SwapSuggestionItem, WarningLevel } from '@/src/types/routine';
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
import { toast } from '@/src/components/ui/feedback';
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
  offlineInfo?: {
    isAvailable: boolean;
    downloadedAt: string | null;
    pendingCount: number;
    failedCount: number;
    conflictCount: number;
    isDownloading: boolean;
    isSyncing: boolean;
    error: string | null;
    isOnline: boolean;
  };
  onDownloadOffline?: () => void;
  onSyncOffline?: () => void;
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
  offlineInfo,
  onDownloadOffline,
  onSyncOffline,
}) => {
  /* ── Estado de versionado ─────────────────────────────────────────────── */
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<RoutineVersionDetail | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [versionAction, setVersionAction] = useState<'activate' | 'restore' | null>(null);

  const isPreviewing = previewVersion !== null;
  const isOfflineActiveMode =
    offlineInfo?.isOnline === false && offlineInfo.isAvailable && routine.isActive;
  const activeVersionId = routine.activeVersionId ?? null;
  const latestVersionId = routine.latestVersionId ?? null;
  // La versión en preview trae su propio `isActive` → no dependemos de que la rutina
  // venga con activeVersionId (degrada bien si el backend todavía no lo manda).
  const previewIsActiveVersion = previewVersion ? previewVersion.isActive : false;

  // En modo preview, la lista de días muestra el contenido de esa versión histórica;
  // si no, el contenido de la versión activa de la rutina.
  const sortedDays = useMemo(
    () => {
      const src = previewVersion ? previewVersion.days : routine?.days;
      return src ? buildSortedDays(src) : [];
    },
    [previewVersion, routine?.days],
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

  // Al cambiar de versión (entrar/salir de preview), reseteamos al primer día: la
  // versión puede tener otra cantidad de días. El guard evita pisar el "hoy" inicial.
  const prevPreviewRef = useRef(previewVersion);
  useEffect(() => {
    if (prevPreviewRef.current === previewVersion) return;
    prevPreviewRef.current = previewVersion;
    setActiveDayIndex(0);
    setSelectedExercise(null);
    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      } catch {
        /* la lista todavía no terminó de medir; el índice 0 se aplica igual */
      }
    });
  }, [previewVersion]);

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

  /* ── Handlers de versionado ───────────────────────────────────────────── */

  /** Carga el contenido de la versión elegida y la muestra en modo preview. */
  const handleSelectVersion = useCallback(async (summary: RoutineVersionSummary) => {
    setIsVersionsOpen(false);
    setIsLoadingVersion(true);
    try {
      const token = await getToken();
      const detail = await getRoutineVersionDetail(routine.id, summary.id, token);
      setPreviewVersion(detail);
    } catch {
      toast.error('No se pudo cargar la versión. Intentá de nuevo.');
    } finally {
      setIsLoadingVersion(false);
    }
  }, [getToken, routine.id]);

  /** Sale del preview y vuelve a la versión activa de la rutina. */
  const handleExitPreview = useCallback(() => {
    setPreviewVersion(null);
    setSelectedExercise(null);
  }, []);

  /** Usa la versión en preview como activa (PATCH active-version, no crea historial). */
  const handleActivateVersion = useCallback(async () => {
    if (!previewVersion) return;
    setVersionAction('activate');
    try {
      const token = await getToken();
      const detail = await setActiveRoutineVersion(routine.id, previewVersion.id, token);
      const updated: Routine = {
        ...routine,
        days: detail.days,
        activeVersionId: detail.id,
        versionNumber: detail.versionNumber,
        // Activar NO cambia la última versión.
        latestVersionId: routine.latestVersionId ?? null,
      };
      onRoutineUpdated(updated);
      setPreviewVersion(null);
    } catch {
      toast.error('No se pudo activar la versión. Intentá de nuevo.');
    } finally {
      setVersionAction(null);
    }
  }, [previewVersion, getToken, routine, onRoutineUpdated]);

  /** Restaura la versión en preview como una versión NUEVA (queda activa + última). */
  const handleRestoreVersion = useCallback(async () => {
    if (!previewVersion) return;
    setVersionAction('restore');
    try {
      const token = await getToken();
      const detail = await restoreRoutineVersion(routine.id, previewVersion.id, token);
      const updated: Routine = {
        ...routine,
        days: detail.days,
        activeVersionId: detail.id,
        latestVersionId: detail.id, // restaurar crea la nueva última versión
        versionNumber: detail.versionNumber,
      };
      onRoutineUpdated(updated);
      setPreviewVersion(null);
    } catch {
      toast.error('No se pudo restaurar la versión. Intentá de nuevo.');
    } finally {
      setVersionAction(null);
    }
  }, [previewVersion, getToken, routine, onRoutineUpdated]);

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

    // En preview de una versión, la única acción es saltar a otra versión.
    if (isPreviewing) {
      return [
        {
          icon: 'layers-outline' as const,
          label: 'Ver versiones',
          onPress: () => { close(); setIsVersionsOpen(true); },
          destructive: false,
        },
      ];
    }

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
    }[] = [];

    if (routine.isActive && onDownloadOffline) {
      items.push({
        icon: offlineInfo?.isAvailable ? 'cloud-done-outline' : 'download-outline',
        label: offlineInfo?.isAvailable ? 'Actualizar offline' : 'Descargar offline',
        onPress: () => { close(); onDownloadOffline(); },
        destructive: false,
      });
    }

    if (
      routine.isActive &&
      onSyncOffline &&
      ((offlineInfo?.pendingCount ?? 0) > 0 ||
        (offlineInfo?.failedCount ?? 0) > 0 ||
        (offlineInfo?.conflictCount ?? 0) > 0)
    ) {
      items.push({
        icon: 'sync-outline',
        label: 'Sincronizar ahora',
        onPress: () => { close(); onSyncOffline(); },
        destructive: false,
      });
    }

    // Versiones: disponible para cualquier rutina (el historial es por rutina).
    items.push({
      icon: 'layers-outline',
      label: 'Ver versiones',
      onPress: () => { close(); setIsVersionsOpen(true); },
      destructive: false,
    });

    // Acciones de entrenamiento: solo aplican sobre la rutina activa (no en la
    // vista de preview/readOnly de una rutina no activa).
    if (!readOnly && !isOfflineActiveMode) {
      items.push({
        icon: 'refresh',
        label: 'Regenerar rutina',
        onPress: () => { close(); onRegenerate(); },
        destructive: false,
      });
      items.push({
        icon: 'swap-horizontal',
        label: 'Cambiar ejercicios',
        onPress: () => { close(); enterSwapMode(); },
        destructive: false,
      });
    }

    if (routine.source === 'Manual') {
      if (!isOfflineActiveMode) {
        items.push({
          icon: 'sparkles',
          label: 'Adaptar con IA',
          onPress: () => { close(); openAdaptModal(); },
          destructive: false,
        });
      }
      items.push({
        icon: 'create-outline',
        label: isOfflineActiveMode ? 'Editar offline' : 'Editar rutina',
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
    isPreviewing,
    isSwapMode, selectedForSwap.size, loadingItems.size, suggestions,
    onRegenerate, enterSwapMode, requestSuggestions, exitSwapMode,
    routine.source, routine.isActive, onActivate, onDelete, openAdaptModal,
    readOnly, isOfflineActiveMode, offlineInfo, onDownloadOffline, onSyncOffline,
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
          offlineLimited={isOfflineActiveMode}
        />
      ) : (
      <Animated.View style={[{ flex: 1 }, contentOpacity]}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View className="px-4" style={{ paddingTop: insets.top + 12, paddingBottom: 8 }}>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={isPreviewing ? handleExitPreview : handleClose}
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

            {menuItems.length > 0 ? (
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

          {/* Badge de versionado: número de versión + distintivos (En uso / Última) */}
          {!isGenerating && (previewVersion ? (
            <View className="flex-row items-center justify-center gap-2 mt-2">
              <VersionBadge label={`Versión ${previewVersion.versionNumber}`} />
              {previewIsActiveVersion && <VersionBadge label="En uso" tone="lime" />}
              {latestVersionId != null && previewVersion.id === latestVersionId && (
                <VersionBadge label="Última" tone="lime" />
              )}
            </View>
          ) : (
            routine.versionNumber != null && (
              <View className="flex-row items-center justify-center gap-2 mt-2">
                <VersionBadge label={`Versión ${routine.versionNumber}`} />
                {activeVersionId != null && activeVersionId === latestVersionId && (
                  <VersionBadge label="Última" tone="lime" />
                )}
              </View>
            )
          ))}

          {routine.isActive && offlineInfo ? (
            <View className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={
                    offlineInfo.conflictCount > 0
                      ? 'warning-outline'
                      : offlineInfo.isAvailable
                        ? 'cloud-done-outline'
                        : 'cloud-download-outline'
                  }
                  size={17}
                  color={offlineInfo.conflictCount > 0 ? '#f59e0b' : '#a3e635'}
                />
                <Text className="flex-1 text-zinc-300 text-xs font-semibold">
                  {offlineInfo.conflictCount > 0
                    ? 'Conflicto pendiente de revisión'
                    : offlineInfo.isAvailable
                      ? `Disponible offline${offlineInfo.downloadedAt ? ` · ${new Date(offlineInfo.downloadedAt).toLocaleDateString('es-UY')}` : ''}`
                      : 'Todavía no descargada para offline'}
                </Text>
                {offlineInfo.pendingCount > 0 || offlineInfo.failedCount > 0 ? (
                  <Text className="text-amber-400 text-xs font-semibold">
                    {offlineInfo.pendingCount + offlineInfo.failedCount} pendiente
                  </Text>
                ) : null}
              </View>
              {offlineInfo.error ? (
                <Text className="text-rose-400 text-xs mt-1">{offlineInfo.error}</Text>
              ) : isOfflineActiveMode ? (
                <Text className="text-zinc-500 text-xs mt-1">
                  Modo offline: se bloquean IA, cambios de ejercicios y ajuste de carga.
                </Text>
              ) : null}
            </View>
          ) : null}
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
                  // En preview hay dos botones apilados → más espacio para no taparlos.
                  paddingBottom:
                    insets.bottom + TAB_BAR_HEIGHT + BOTTOM_BUTTON_HEIGHT + 32 + (isPreviewing ? 64 : 0),
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

        {/* ── Botón inferior: CTAs de versión en preview, "Comenzar" en vivo ── */}
        {!isGenerating && isPreviewing ? (
          <View
            className="absolute w-full px-4"
            style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
          >
            {previewIsActiveVersion ? (
              <View className="flex-row items-center justify-center gap-1.5 mb-2">
                <Ionicons name="checkmark-circle" size={16} className="text-lime-400" />
                <Text className="text-lime-400 text-sm font-semibold">Esta es la versión en uso</Text>
              </View>
            ) : (
              <TouchableOpacity
                className="w-full h-[60px] bg-white rounded-2xl items-center justify-center"
                style={{ opacity: versionAction !== null ? 0.6 : 1 }}
                disabled={versionAction !== null}
                onPress={handleActivateVersion}
              >
                {versionAction === 'activate' ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-zinc-900 font-bold text-base">Activar versión</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="w-full h-[52px] mt-2 rounded-2xl items-center justify-center border border-white/20 bg-white/5"
              style={{ opacity: versionAction !== null ? 0.6 : 1 }}
              disabled={versionAction !== null}
              onPress={handleRestoreVersion}
            >
              {versionAction === 'restore' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Restaurar como nueva versión</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (!isGenerating && !readOnly && (
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
        ))}

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

        {/* ── Versionado: lista de versiones + loader del detalle ──────────── */}
        <RoutineVersionsSheet
          visible={isVersionsOpen}
          routineId={routine.id}
          selectedVersionId={previewVersion?.id ?? activeVersionId}
          onClose={() => setIsVersionsOpen(false)}
          onSelectVersion={handleSelectVersion}
        />

        {isLoadingVersion && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
              <ActivityIndicator size="large" color="#a3e635" />
              <Text className="text-white mt-3 font-medium">Cargando versión...</Text>
            </View>
          </View>
        )}
      </Animated.View>
      )}
    </Animated.View>
  );
};
