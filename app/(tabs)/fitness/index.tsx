import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { EmptyPreviewCard } from '@/src/components/features/routine/EmptyPreviewCard';
import { CardLayout, RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { RoutinePreviewCard } from '@/src/components/features/routine/RoutinePreviewCard';
import { EmptyTrainingHistory } from '@/src/components/features/training-history/EmptyTrainingHistory';
import { TrainingHistoryCardSkeleton } from '@/src/components/features/training-history/TrainingHistoryCardSkeleton';
import { TrainingHistoryPreviewCard } from '@/src/components/features/training-history/TrainingHistoryPreviewCard';
import { useRoutineDraft } from '@/src/hooks/useRoutineDraft';
import { useRoutinePreview } from '@/src/hooks/useRoutinePreview';
import { useTrainingHistoryPreview } from '@/src/hooks/useTrainingHistoryPreview';
import { activateRoutine, deleteRoutine, generateRoutine, getActiveRoutine, getRoutineById, regenerateRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine, RoutineDay, RoutineSummary } from '@/src/types/routine';
import { TrainingHistorySession } from '@/src/types/training-history';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function FitnessScreen() {
  const { getToken } = useAuth();
  const router = useRouter();

  /* ── Estado de rutina ─────────────────────────────────────────────────── */
  const [cardState, setCardState] = useState<CardState>('initial');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  /* ── Estado de vistas ─────────────────────────────────────────────────── */
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout | null>(null);
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);

  const cardRef = useRef<View>(null);
  const detailRoutineRef = useRef<Routine | null>(null);
  const createCardRef = useRef<View>(null);
  const [createCardLayout, setCreateCardLayout] = useState<CardLayout | null>(null);

  /** Rutina recién creada manualmente (para mostrar en RoutineDetailView tras guardar) */
  const [createdRoutine, setCreatedRoutine] = useState<Routine | null>(null);

  /** Rutina que se está editando (abre CreateRoutineView en modo edición) */
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  /* ── Estado para preview de rutinas ───────────────────────────────────── */
  const [selectedPreviewRoutine, setSelectedPreviewRoutine] = useState<RoutineSummary | null>(null);
  const [selectedFullRoutine, setSelectedFullRoutine] = useState<Routine | null>(null);
  const [isLoadingPreviewRoutine, setIsLoadingPreviewRoutine] = useState(false);
  const [showPreviewDetail, setShowPreviewDetail] = useState(false);
  const [previewCardLayout, setPreviewCardLayout] = useState<CardLayout | null>(null);
  const previewCardRef = useRef<View>(null);

  const { setOnCreateRoutine, setDetailVisible, activeRoutine, setActiveRoutine, setViewingActiveRoutine, setIsCreatingRoutine } = useRoutineDetailContext();
  const activeRoutineRef = useRef(activeRoutine);
  activeRoutineRef.current = activeRoutine;
  const routineRef = useRef(routine);
  routineRef.current = routine;

  /* ── Hook para preview de rutinas ────────────────────────────────────── */
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const { aiRoutines, manualRoutines, isLoading: isLoadingPreview, refresh: refreshPreview } = useRoutinePreview(previewToken);

  // Actualizar token cuando cambia
  useEffect(() => {
    getToken().then((t) => { setPreviewToken(t); });
  }, [getToken]);

  /* ── Refs para callbacks estables ─────────────────────────────────────── */
  const setShowRef = useRef(setShowCreateRoutine);
  const setDetailVisibleRef = useRef(setDetailVisible);
  setShowRef.current = setShowCreateRoutine;
  setDetailVisibleRef.current = setDetailVisible;

  /* ── Carga de rutina activa (usa caché de contexto compartido) ─────────── */
  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        try {
          // 1. Si ya hay rutina en el contexto compartido, usarla sin fetch
          const cached = activeRoutineRef.current;
          if (cached) {
            setRoutine(cached);
            setCardState('success');
            setIsFetchingData(false);
            return;
          }

          // 2. Sin contexto: carga optimista desde AsyncStorage
          const storedRoutine = await AsyncStorage.getItem('@user_routine');
          if (storedRoutine) {
            const parsed = JSON.parse(storedRoutine) as Routine;
            setRoutine(parsed);
            setActiveRoutine(parsed);
            setCardState('success');
          }

          const token = await getToken();
          if (!token) return;

          // 3. Fetch al back (solo si el contexto estaba vacío)
          const fetched = await getActiveRoutine(token);
          if (fetched) {
            setRoutine(fetched);
            setActiveRoutine(fetched);
            await AsyncStorage.setItem('@user_routine', JSON.stringify(fetched));
            setCardState('success');
          } else {
            await AsyncStorage.removeItem('@user_routine');
            setRoutine(null);
            setActiveRoutine(null);
            setCardState('initial');
          }
        } catch (error) {
          console.error('Error inicializando datos en Fitness:', error);
        } finally {
          setIsFetchingData(false);
        }
      };

      initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  /* ── Handlers de rutina ───────────────────────────────────────────────── */
  const handleViewPlan = useCallback(() => {
    if (!routineRef.current) return;
    cardRef.current?.measureInWindow((x, y, width, height) => {
      setCardLayout({ x, y, width, height });
      setShowRoutineDetail(true);
      setDetailVisible(true);
      setViewingActiveRoutine(true);
    });
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleCloseDetail = useCallback(() => {
    setShowRoutineDetail(false);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
    detailRoutineRef.current = null;
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleGenerate = async () => {
    setCardState('loading');
    try {
      const token = await getToken();
      const newRoutine = await generateRoutine(token);
      setRoutine(newRoutine);
      setActiveRoutine(newRoutine);
      await AsyncStorage.setItem('@user_routine', JSON.stringify(newRoutine));
      setCardState('success');
    } catch (error) {
      console.error(error);
      setCardState('initial');
    }
  };

  const handleRegenerate = useCallback(async () => {
    setCardState('loading');
    try {
      const token = await getToken();
      const newRoutine = await regenerateRoutine(token);
      setRoutine(newRoutine);
      setActiveRoutine(newRoutine);
      await AsyncStorage.setItem('@user_routine', JSON.stringify(newRoutine));
      setCardState('success');
    } catch (error) {
      console.error(error);
      setCardState('success');
    }
  }, [getToken]);

  const handleRoutineUpdated = useCallback(async (updated: Routine) => {
    const updateIfSameRoutine = (current: Routine | null) => (
      current?.id === updated.id ? updated : current
    );

    const isActiveRoutineUpdate =
      updated.isActive || routineRef.current?.id === updated.id || activeRoutineRef.current?.id === updated.id;

    detailRoutineRef.current = updateIfSameRoutine(detailRoutineRef.current);
    setCreatedRoutine(updateIfSameRoutine);
    setSelectedFullRoutine(updateIfSameRoutine);

    if (isActiveRoutineUpdate) {
      setRoutine(updated);
      setActiveRoutine(updated);
    }

    refreshPreview();

    if (!isActiveRoutineUpdate) return;

    try {
      await AsyncStorage.setItem('@user_routine', JSON.stringify(updated));
    } catch (error) {
      console.error('No se pudo cachear la rutina actualizada:', error);
    }
  }, [refreshPreview, setActiveRoutine]);

  const handleOpenCreate = useCallback(() => {
    const open = (layout: CardLayout) => {
      setCreateCardLayout(layout);
      setShowCreateRoutine(true);
      setDetailVisible(true);
      setIsCreatingRoutine(true);
    };
    if (createCardRef.current) {
      createCardRef.current.measureInWindow((x, y, width, height) => {
        open(width > 0 ? { x, y, width, height } : {
          x: SCREEN_WIDTH * 0.1,
          y: SCREEN_HEIGHT * 0.3,
          width: SCREEN_WIDTH * 0.8,
          height: 120,
        });
      });
    } else {
      open({
        x: SCREEN_WIDTH * 0.1,
        y: SCREEN_HEIGHT * 0.3,
        width: SCREEN_WIDTH * 0.8,
        height: 120,
      });
    }
  }, [setDetailVisible, setIsCreatingRoutine]);

  /** Convierte una Routine del backend al formato RoutineDraft del editor */
  const routineToDraft = useCallback((r: Routine) => {
    const DAYS_VALUE_MAP: Record<string, string> = {
      'Lunes': 'monday', 'Martes': 'tuesday', 'Mi\u00e9rcoles': 'wednesday',
      'Jueves': 'thursday', 'Viernes': 'friday', 'S\u00e1bado': 'saturday', 'Domingo': 'sunday',
    };
    return {
      name: r.name,
      days: r.days.map((day: RoutineDay): CreateRoutineDay => ({
        id: day.id,
        value: DAYS_VALUE_MAP[day.day] ?? day.day.toLowerCase(),
        label: day.day,
        exercises: day.exercises.map((ex): CreateRoutineExercise => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.name,
          gifUrl: ex.gifUrl,
          equipments: [],
          sets: parseInt(ex.sets, 10) || 3,
          reps: ex.repType === 'Timed'
            ? parseInt(ex.durationSeconds ?? '30', 10)
            : parseInt(ex.currentRep ?? '12', 10),
          repMode: ex.repType === 'Timed' ? 'secs' : 'reps',
          restSeconds: parseInt(ex.rest, 10) || 60,
          loadType: ex.loadType ?? 'BodyWeight',
          plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
        })),
      })),
    };
  }, []);

  /** Abre el editor en modo edición con la rutina dada */
  const handleOpenEdit = useCallback((r: Routine) => {
    console.log('[handleOpenEdit] Routine to edit:', { id: r.id, name: r.name, source: r.source });
    const open = (layout: CardLayout) => {
      setCreateCardLayout(layout);
      setShowCreateRoutine(true);
      setDetailVisible(true);
    };
    setEditingRoutine(r);
    setShowRoutineDetail(false);
    setCreatedRoutine(null);
    setShowPreviewDetail(false);
    if (createCardRef.current) {
      createCardRef.current.measureInWindow((x, y, width, height) => {
        open(width > 0 ? { x, y, width, height } : {
          x: SCREEN_WIDTH * 0.1,
          y: SCREEN_HEIGHT * 0.3,
          width: SCREEN_WIDTH * 0.8,
          height: 120,
        });
      });
    } else {
      open({
        x: SCREEN_WIDTH * 0.1,
        y: SCREEN_HEIGHT * 0.3,
        width: SCREEN_WIDTH * 0.8,
        height: 120,
      });
    }
  }, [setDetailVisible]);

  const { draft, saveDraft, clearDraft } = useRoutineDraft();

  /* ── Hook para preview del historial de entrenamiento ─────────────────── */
  const { sessions: historyPreview, isLoading: isLoadingHistory } = useTrainingHistoryPreview(previewToken);

  const handleViewAllHistory = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/fitness/training-history' as any);
  }, [router]);

  const handleHistorySessionPress = useCallback((session: TrainingHistorySession) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/fitness/training-history/[id]' as any, params: { id: session.id } });
  }, [router]);

  const handleActivateRoutine = useCallback(async (r: Routine) => {
    try {
      const token = await getToken();
      await activateRoutine(r.id, token);

      // Usar los datos que ya tenemos — el endpoint no devuelve cuerpo
      const activated: Routine = { ...r, isActive: true };

      activeRoutineRef.current = activated;
      routineRef.current = activated;
      setActiveRoutine(activated);
      setRoutine(activated);
      setCardState('success');
      await AsyncStorage.setItem('@user_routine', JSON.stringify(activated));
      refreshPreview();

      setShowPreviewDetail(false);
      setSelectedPreviewRoutine(null);
      setSelectedFullRoutine(null);
      setCreatedRoutine(null);
      setShowRoutineDetail(false);
      setDetailVisible(false);
      setViewingActiveRoutine(false);
    } catch (err) {
      console.error('[handleActivateRoutine] ERROR', err);
      Alert.alert('Error', 'No se pudo activar la rutina. Intentá de nuevo.');
    }
  }, [getToken, setActiveRoutine, refreshPreview, setDetailVisible, setViewingActiveRoutine]);

  /** Elimina una rutina tras confirmación */
  const handleDeleteRoutine = useCallback((r: Routine) => {
    Alert.alert(
      'Eliminar rutina',
      '¿Eliminar esta rutina? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'Usuario no autenticado');
                return;
              }
              await deleteRoutine(r.id, token);
              // Si era la rutina activa, limpiar estado
              if (r.isActive) {
                setRoutine(null);
                setActiveRoutine(null);
                setCardState('initial');
                await AsyncStorage.removeItem('@user_routine');
              }
              // Cerrar vistas abiertas
              setShowRoutineDetail(false);
              setCreatedRoutine(null);
              setShowPreviewDetail(false);
              setSelectedFullRoutine(null);
              setDetailVisible(false);
              setViewingActiveRoutine(false);
              refreshPreview();
              Alert.alert('Éxito', 'La rutina fue eliminada correctamente');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la rutina');
            }
          },
        },
      ],
    );
  }, [getToken, setActiveRoutine, setDetailVisible, setViewingActiveRoutine, refreshPreview]);

  /** Cierra el creador y abre el detalle de la rutina recién guardada */
  const handleRoutineCreated = useCallback(async (routine: Routine) => {
    if (routine.isActive) {
      setRoutine(routine);
      setCardState('success');
      try {
        await AsyncStorage.setItem('@user_routine', JSON.stringify(routine));
      } catch (error) {
        console.error('Error cacheando rutina creada:', error);
      }
    }
    setShowCreateRoutine(false);
    setCreatedRoutine(routine);
    if (routine.isActive) setViewingActiveRoutine(true);
    refreshPreview();
    createCardRef.current?.measureInWindow((x, y, width, height) => {
      setCreateCardLayout({ x, y, width, height });
    });
  }, [refreshPreview, setViewingActiveRoutine]);

  /* ── Handlers para preview de rutinas ─────────────────────────────────── */
  const handleViewAllRoutines = useCallback(() => {
    router.push('/fitness/routines');
  }, [router]);

  const handlePreviewRoutinePress = useCallback(async (routineSummary: RoutineSummary) => {
    setSelectedPreviewRoutine(routineSummary);
    setIsLoadingPreviewRoutine(true);
    setDetailVisible(true);

    try {
      const token = await getToken();
      const fullRoutine = await getRoutineById(routineSummary.id, token);
      console.log('[FitnessScreen] Routine loaded:', {
        id: fullRoutine.id,
        name: fullRoutine.name,
        daysCount: fullRoutine.days?.length,
        firstDayExercises: fullRoutine.days?.[0]?.exercises?.map(e => ({
          id: e.id,
          name: e.name,
          gifUrl: e.gifUrl,
          exerciseId: e.exerciseId,
        })),
      });
      setSelectedFullRoutine(fullRoutine);
      setShowPreviewDetail(true);
      if (fullRoutine.isActive) setViewingActiveRoutine(true);
    } catch (error) {
      console.error('[FitnessScreen] Error fetching routine:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina. Intentá de nuevo.');
      setDetailVisible(false);
    } finally {
      setIsLoadingPreviewRoutine(false);
    }
  }, [getToken, setDetailVisible]);

  const handleClosePreviewDetail = useCallback(() => {
    setShowPreviewDetail(false);
    setSelectedPreviewRoutine(null);
    setSelectedFullRoutine(null);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
  }, [setDetailVisible]);

  const handleDiscardDraft = useCallback(() => {
    Alert.alert(
      'Descartar borrador',
      '¿Querés eliminar el borrador? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: clearDraft },
      ],
    );
  }, [clearDraft]);

  /* ── Registro del handler "Crear rutina" ──────────────────────────────── */
  useEffect(() => {
    setOnCreateRoutine(() => () => {
      handleOpenCreate();
    });
    return () => setOnCreateRoutine(null);
  }, [setOnCreateRoutine, handleOpenCreate]);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView contentContainerClassName="pt-8 pb-32" showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View className="px-4 mb-1">
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Fitness</Text>
        </View>

        {/* Sub-sección: Rutina Activa o bloque de inicio */}
        {cardState !== 'success' ? (
          <>
            <View className="px-4 mt-6 mb-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Comenzá tu entrenamiento</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Generá una rutina con IA o armá la tuya desde cero.
              </Text>
            </View>
            <ActionCard
              ref={cardRef}
              cardState={cardState}
              onGenerate={handleGenerate}
              onViewPlan={handleViewPlan}
              routine={routine}
              isLoadingInitial={isFetchingData}
            />

            <View collapsable={false}>
              <EmptyCreateCard onPress={handleOpenCreate} />
            </View>
          </>
        ) : (
          <>
            <View className="px-4 mt-6 mb-2">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Rutina activa</Text>
            </View>
            <ActionCard
              ref={cardRef}
              cardState={cardState}
              onGenerate={handleGenerate}
              onViewPlan={handleViewPlan}
              routine={routine}
              isLoadingInitial={isFetchingData}
            />
          </>
        )}

        {/* Borrador de rutina en proceso — visible siempre que exista */}
        {draft && (
          <View ref={createCardRef} className="mt-4" collapsable={false}>
            <View className="px-4 mb-2">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Rutina en proceso</Text>
            </View>
            <DraftCard
              draft={draft}
              onContinue={handleOpenCreate}
              onDiscard={handleDiscardDraft}
            />
          </View>
        )}

        {/* Sub-sección: Preview de Rutinas */}
        <View className="px-4 mt-6 mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Rutinas</Text>
            <TouchableOpacity onPress={handleViewAllRoutines} className="flex-row items-center">
              <Text className="text-lime-600 dark:text-lime-400 text-sm font-medium mr-1">
                Ver todas
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#65a30d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rutinas generadas por IA */}
        <View className="mb-4">
          <Text className="px-4 text-slate-500 dark:text-slate-400 text-sm mb-2">
            Generadas por IA
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4"
          >
            {aiRoutines.length > 0 ? (
              aiRoutines.map((routine) => (
                <RoutinePreviewCard
                  key={routine.id}
                  routine={routine}
                  onPress={handlePreviewRoutinePress}
                />
              ))
            ) : (
              <EmptyPreviewCard source="AI" />
            )}
          </ScrollView>
        </View>

        {/* Rutinas creadas manualmente */}
        <View className="mb-2">
          <Text className="px-4 text-slate-500 dark:text-slate-400 text-sm mb-2">
            Creadas manualmente
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4"
          >
            {manualRoutines.length > 0 ? (
              manualRoutines.map((routine) => (
                <RoutinePreviewCard
                  key={routine.id}
                  routine={routine}
                  onPress={handlePreviewRoutinePress}
                />
              ))
            ) : (
              <EmptyPreviewCard source="Manual" />
            )}
          </ScrollView>
        </View>

        {/* Sub-sección: Historial de entrenamiento */}
        <View className="px-4 mt-6 mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Historial de entrenamiento
            </Text>
            <TouchableOpacity onPress={handleViewAllHistory} className="flex-row items-center">
              <Text className="text-lime-600 dark:text-lime-400 text-sm font-medium mr-1">
                Ver todo
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#65a30d" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4"
          >
            {isLoadingHistory ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TrainingHistoryCardSkeleton key={i} variant="preview" />
              ))
            ) : historyPreview.length > 0 ? (
              historyPreview.map((session) => (
                <TrainingHistoryPreviewCard
                  key={session.id}
                  session={session}
                  onPress={handleHistorySessionPress}
                />
              ))
            ) : (
              <EmptyTrainingHistory variant="preview" />
            )}
          </ScrollView>
        </View>

      </ScrollView>

      {/* Vista expandida de rutina activa */}
      {showRoutineDetail && (detailRoutineRef.current ?? routineRef.current) && cardLayout && (
        <RoutineDetailView
          routine={(detailRoutineRef.current ?? routineRef.current)!}
          onClose={handleCloseDetail}
          cardLayout={cardLayout}
          isGenerating={cardState === 'loading'}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
          onEdit={routineRef.current?.source === 'Manual' ? () => handleOpenEdit(routineRef.current!) : undefined}
          onActivate={!routineRef.current?.isActive ? () => handleActivateRoutine(routineRef.current!) : undefined}
          onDelete={() => handleDeleteRoutine(routineRef.current!)}
        />
      )}

      {/* Overlay de creación / edición de rutina manual */}
      {showCreateRoutine && createCardLayout && (
        <CreateRoutineView
          cardLayout={createCardLayout}
          initialDraft={editingRoutine ? routineToDraft(editingRoutine) : (draft ?? undefined)}
          editingRoutineId={editingRoutine?.id}
          onSaveDraft={editingRoutine ? undefined : saveDraft}
          onClearDraft={editingRoutine ? undefined : clearDraft}
          onClose={() => { setShowCreateRoutine(false); setDetailVisible(false); setEditingRoutine(null); setIsCreatingRoutine(false); }}
          onRoutineCreated={(r) => {
            const wasEditingActive = !!editingRoutine && editingRoutine.isActive;
            setEditingRoutine(null);
            setIsCreatingRoutine(false);
            if (wasEditingActive) {
              setShowCreateRoutine(false);
              const updated = { ...r, isActive: true };
              detailRoutineRef.current = updated;
              setRoutine(updated);
              setCardState('success');
              setActiveRoutine(updated);
              AsyncStorage.setItem('@user_routine', JSON.stringify(updated)).catch(() => {});
              refreshPreview();
              cardRef.current?.measureInWindow((x, y, width, height) => {
                setCardLayout({ x, y, width, height });
                setShowRoutineDetail(true);
                setDetailVisible(true);
                setViewingActiveRoutine(true);
              });
            } else {
              handleRoutineCreated(r);
            }
          }}
        />
      )}

      {/* Detalle de rutina recién creada manualmente */}
      {createdRoutine && createCardLayout && (
        <RoutineDetailView
          routine={createdRoutine}
          onClose={() => { setCreatedRoutine(null); setDetailVisible(false); setViewingActiveRoutine(false); }}
          cardLayout={createCardLayout}
          readOnly={!createdRoutine?.isActive}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
          onEdit={createdRoutine.source === 'Manual' ? () => handleOpenEdit(createdRoutine) : undefined}
          onActivate={!createdRoutine.isActive ? () => handleActivateRoutine(createdRoutine) : undefined}
          onDelete={() => handleDeleteRoutine(createdRoutine)}
        />
      )}

      {/* Detalle de rutina del preview */}
      {showPreviewDetail && selectedFullRoutine && (
        <RoutineDetailView
          routine={selectedFullRoutine}
          onClose={handleClosePreviewDetail}
          cardLayout={{
            x: SCREEN_WIDTH * 0.2,
            y: SCREEN_HEIGHT * 0.3,
            width: SCREEN_WIDTH * 0.6,
            height: 200,
          }}
          readOnly={!selectedFullRoutine.isActive}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
          onEdit={selectedFullRoutine.source === 'Manual' ? () => handleOpenEdit(selectedFullRoutine) : undefined}
          onActivate={!selectedFullRoutine.isActive ? () => handleActivateRoutine(selectedFullRoutine) : undefined}
          onDelete={() => handleDeleteRoutine(selectedFullRoutine)}
        />
      )}

      {/* Loading mientras se carga la rutina del preview */}
      {isLoadingPreviewRoutine && selectedPreviewRoutine && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#a3e635" />
            <Text className="text-slate-900 dark:text-slate-50 mt-4 font-medium">
              Cargando rutina...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ── EmptyCreateCard ──────────────────────────────────────────────────────── */

function EmptyCreateCard({ onPress }: { onPress: () => void }) {
  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mx-4 mt-3">
      <View className="flex-row items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
            Armá tu rutina
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 leading-5">
            Elegí los días, ejercicios y configuración a tu medida.
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="py-4 rounded-xl items-center bg-lime-400"
      >
        <Text className="text-slate-900 font-bold text-base">Crear rutina</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── DraftCard ────────────────────────────────────────────────────────────── */

interface DraftCardProps {
  draft: { name: string; days: { id: string }[] };
  onContinue: () => void;
  onDiscard: () => void;
}

function DraftCard({ draft, onContinue, onDiscard }: DraftCardProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const subtitle = draft.name.trim()
    ? `"${draft.name}" · ${draft.days.length} ${draft.days.length === 1 ? 'día' : 'días'}`
    : `${draft.days.length} ${draft.days.length === 1 ? 'día cargado' : 'días cargados'}`;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mx-4 mt-3">
      <View className="flex-row items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
            Rutina en creación
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 leading-5">
            {subtitle}
          </Text>
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="create-outline" size={40} color="#a3e635" />
        </Animated.View>
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          className="flex-1 py-4 rounded-xl items-center bg-lime-400"
        >
          <Text className="text-slate-900 font-bold text-base">Seguir creando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDiscard}
          activeOpacity={0.8}
          className="px-4 rounded-xl items-center justify-center bg-slate-200 dark:bg-slate-800"
        >
          <Ionicons name="trash-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
