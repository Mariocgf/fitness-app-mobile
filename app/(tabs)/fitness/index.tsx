import { logger } from '@/src/utils/logger';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { CardLayout, RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { ConflictResolutionModal } from '@/src/components/features/routine/ConflictResolutionModal';
import { RoutineLibraryCard } from '@/src/components/features/routine/RoutineLibraryCard';
import { DraftCard } from '@/src/components/features/routine/DraftCard';
import { RecentActivityCard } from '@/src/components/features/training-history/RecentActivityCard';
import { useRoutineDraft } from '@/src/hooks/useRoutineDraft';
import { useOfflineModuleStatus } from '@/src/hooks/useOfflineModuleStatus';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { useRoutinePreview } from '@/src/hooks/useRoutinePreview';
import { useTrainingHistoryPreview } from '@/src/hooks/useTrainingHistoryPreview';
import {
  downloadFitnessRoutineOffline,
  getOfflineFitnessRoutine,
  getRoutineUpdateConflicts,
  resolveConflictKeepLocal,
  resolveConflictKeepServer,
  syncOfflineOperations,
} from '@/src/offline/service';
import { OfflineOperation, RoutineUpdateOperationPayload } from '@/src/offline/types';
import { activateRoutine, deleteRoutine, generateRoutine, getActiveRoutine, getRoutineById, regenerateRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { Routine, RoutineSource, RoutineSummary } from '@/src/types/routine';
import { TrainingHistorySession } from '@/src/types/training-history';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { confirm, toast } from '@/src/components/ui/feedback';
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
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  /** Operación en conflicto que el usuario está revisando (null = modal cerrado). */
  const [conflictOp, setConflictOp] =
    useState<OfflineOperation<RoutineUpdateOperationPayload> | null>(null);
  const { isOnline } = useNetworkStatus();
  const { status: offlineStatus, refresh: refreshOfflineStatus } =
    useOfflineModuleStatus('fitness-active-routine');

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

  /* ── Estado para preview de rutinas ───────────────────────────────────── */
  const [selectedPreviewRoutine, setSelectedPreviewRoutine] = useState<RoutineSummary | null>(null);
  const [selectedFullRoutine, setSelectedFullRoutine] = useState<Routine | null>(null);
  const [isLoadingPreviewRoutine, setIsLoadingPreviewRoutine] = useState(false);
  const [showPreviewDetail, setShowPreviewDetail] = useState(false);

  const { setOnCreateRoutine, setDetailVisible, activeRoutine, setActiveRoutine, setViewingActiveRoutine, setIsCreatingRoutine } = useRoutineDetailContext();
  const activeRoutineRef = useRef(activeRoutine);
  activeRoutineRef.current = activeRoutine;
  const routineRef = useRef(routine);
  routineRef.current = routine;

  /* ── Hook para preview de rutinas ────────────────────────────────────── */
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const { aiRoutines, manualRoutines, isLoading: isLoadingPreview, refresh: refreshPreview } = useRoutinePreview(previewToken);

  /* ── Tab de la biblioteca de rutinas (IA / Manual) ────────────────────── */
  const [libraryTab, setLibraryTab] = useState<RoutineSource>('AI');
  const libraryRoutines = libraryTab === 'AI' ? aiRoutines : manualRoutines;

  // Actualizar token cuando cambia
  useEffect(() => {
    getToken().then((t) => { setPreviewToken(t); });
  }, [getToken, setActiveRoutine]);

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

          // 2. Sin contexto: carga optimista desde SQLite solo si el usuario descargó offline.
          const storedRoutine = await getOfflineFitnessRoutine();
          if (storedRoutine) {
            setRoutine(storedRoutine);
            setActiveRoutine(storedRoutine);
            setCardState('success');
          }

          const token = await getToken();
          if (!token) return;

          // 3. Fetch al back (solo si el contexto estaba vacío)
          const fetched = await getActiveRoutine(token);
          if (fetched) {
            setRoutine(fetched);
            setActiveRoutine(fetched);
            setCardState('success');
          } else {
            setRoutine(null);
            setActiveRoutine(null);
            setCardState('initial');
          }
        } catch (error) {
          logger.error('Error inicializando datos en Fitness:', error);
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

  /* ── Apertura automática del detalle al venir desde el Home ───────────── */
  const { openRoutineId, openCreate } = useLocalSearchParams<{ openRoutineId?: string; openCreate?: string }>();

  useEffect(() => {
    if (!openRoutineId || isFetchingData || !routine) return;
    // Limpiamos el parámetro para no reabrir en re-renders / navegaciones futuras
    router.setParams({ openRoutineId: undefined });
    // Cerramos cualquier otro detalle abierto (preview de rutina X, recién creada o
    // creador). Si no, su overlay queda ENCIMA de la activa y el usuario sigue viendo
    // la rutina X (o su edición) hasta volver atrás.
    setShowPreviewDetail(false);
    setSelectedFullRoutine(null);
    setSelectedPreviewRoutine(null);
    setCreatedRoutine(null);
    setShowCreateRoutine(false);
    setIsCreatingRoutine(false);
    // Esperamos un frame para asegurar que la card esté montada y medible
    requestAnimationFrame(() => handleViewPlan());
  }, [openRoutineId, routine, isFetchingData, handleViewPlan, router, setIsCreatingRoutine]);

  const handleGenerate = async () => {
    setCardState('loading');
    try {
      const token = await getToken();
      const newRoutine = await generateRoutine(token);
      setRoutine(newRoutine);
      setActiveRoutine(newRoutine);
      setCardState('success');
    } catch (error) {
      logger.error(error);
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
      setCardState('success');
    } catch (error) {
      logger.error(error);
      setCardState('success');
    }
  }, [getToken, setActiveRoutine]);

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

    refreshOfflineStatus();
  }, [refreshOfflineStatus, refreshPreview, setActiveRoutine]);

  const handleDownloadOffline = useCallback(async () => {
    const current = routineRef.current;
    if (!current || isDownloadingOffline) return;
    setIsDownloadingOffline(true);
    setOfflineError(null);
    try {
      const token = await getToken();
      await downloadFitnessRoutineOffline(token, current);
      await refreshOfflineStatus();
      toast.success('Tu rutina quedó disponible para usar offline.', { title: 'Listo' });
    } catch (error: any) {
      const message = error?.message ?? 'No pudimos descargar la rutina offline.';
      setOfflineError(message);
      toast.error(message);
    } finally {
      setIsDownloadingOffline(false);
    }
  }, [getToken, isDownloadingOffline, refreshOfflineStatus]);

  const handleSyncOffline = useCallback(async () => {
    if (isSyncingOffline) return;
    setIsSyncingOffline(true);
    setOfflineError(null);
    try {
      const token = await getToken();
      const result = await syncOfflineOperations(token);
      await refreshOfflineStatus();
      if (result.conflicts > 0) {
        toast.warning('Hay conflictos que necesitan revisión.', { title: 'Sincronización' });
      } else {
        toast.success(`Sincronizadas: ${result.synced}. Fallidas: ${result.failed}.`, {
          title: 'Sincronización',
        });
      }
    } catch (error: any) {
      const message = error?.message ?? 'No pudimos sincronizar ahora.';
      setOfflineError(message);
      toast.error(message);
    } finally {
      setIsSyncingOffline(false);
    }
  }, [getToken, isSyncingOffline, refreshOfflineStatus]);

  const handleReviewConflict = useCallback(async () => {
    try {
      const conflicts = await getRoutineUpdateConflicts();
      if (conflicts.length === 0) {
        toast.info('No hay conflictos para revisar.');
        await refreshOfflineStatus();
        return;
      }
      setConflictOp(conflicts[0]);
    } catch (error: any) {
      toast.error(error?.message ?? 'No pudimos abrir el conflicto.');
    }
  }, [refreshOfflineStatus]);

  const handleKeepServer = useCallback(async () => {
    if (!conflictOp) return;
    try {
      await resolveConflictKeepServer(conflictOp);
      if (conflictOp.serverRoutine) {
        await handleRoutineUpdated(conflictOp.serverRoutine);
      }
      await refreshOfflineStatus();
      toast.success('Te quedaste con la versión del servidor.', { title: 'Conflicto resuelto' });
    } catch (error: any) {
      toast.error(error?.message ?? 'No pudimos resolver el conflicto.');
    } finally {
      setConflictOp(null);
    }
  }, [conflictOp, handleRoutineUpdated, refreshOfflineStatus]);

  const handleKeepLocal = useCallback(async () => {
    if (!conflictOp) return;
    try {
      const token = await getToken();
      const result = await resolveConflictKeepLocal(conflictOp, token);
      await refreshOfflineStatus();
      if (result.conflicts > 0) {
        toast.warning('La rutina volvió a cambiar en el servidor. Revisá de nuevo.', {
          title: 'Conflicto',
        });
      } else if (result.failed > 0) {
        toast.error('No pudimos subir tu versión. Intentá más tarde.');
      } else {
        toast.success('Se mantuvo tu versión.', { title: 'Conflicto resuelto' });
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'No pudimos resolver el conflicto.');
    } finally {
      setConflictOp(null);
    }
  }, [conflictOp, getToken, refreshOfflineStatus]);

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

  /* ── Apertura automática del creador al venir desde "Mis rutinas" ─────── */
  useEffect(() => {
    if (!openCreate) return;
    // Limpiamos el parámetro para no reabrir en re-renders / navegaciones futuras
    router.setParams({ openCreate: undefined });
    requestAnimationFrame(() => handleOpenCreate());
  }, [openCreate, handleOpenCreate, router]);

  const { draft, saveDraft, clearDraft } = useRoutineDraft();

  /* ── Hook para preview del historial de entrenamiento ─────────────────── */
  const { sessions: historyPreview, isLoading: isLoadingHistory } = useTrainingHistoryPreview(previewToken);

  const handleViewAllHistory = useCallback(() => {
    router.push('/fitness/training-history' as any);
  }, [router]);

  const handleHistorySessionPress = useCallback((session: TrainingHistorySession) => {
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
      refreshPreview();

      setShowPreviewDetail(false);
      setSelectedPreviewRoutine(null);
      setSelectedFullRoutine(null);
      setCreatedRoutine(null);
      setShowRoutineDetail(false);
      setDetailVisible(false);
      setViewingActiveRoutine(false);
    } catch (err) {
      logger.error('[handleActivateRoutine] ERROR', err);
      toast.error('No se pudo activar la rutina. Intentá de nuevo.');
    }
  }, [getToken, setActiveRoutine, refreshPreview, setDetailVisible, setViewingActiveRoutine]);

  /** Elimina una rutina tras confirmación */
  const handleDeleteRoutine = useCallback(async (r: Routine) => {
    const confirmed = await confirm({
      title: 'Eliminar rutina',
      message: '¿Eliminar esta rutina? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Usuario no autenticado');
        return;
      }
      await deleteRoutine(r.id, token);
      // Si era la rutina activa, limpiar estado
      if (r.isActive) {
        setRoutine(null);
        setActiveRoutine(null);
        setCardState('initial');
      }
      // Cerrar vistas abiertas
      setShowRoutineDetail(false);
      setCreatedRoutine(null);
      setShowPreviewDetail(false);
      setSelectedFullRoutine(null);
      setDetailVisible(false);
      setViewingActiveRoutine(false);
      refreshPreview();
      toast.success('La rutina fue eliminada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar la rutina');
    }
  }, [getToken, setActiveRoutine, setDetailVisible, setViewingActiveRoutine, refreshPreview]);

  /** Cierra el creador y abre el detalle de la rutina recién guardada */
  const handleRoutineCreated = useCallback(async (routine: Routine) => {
    if (routine.isActive) {
      setRoutine(routine);
      setCardState('success');
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
      setSelectedFullRoutine(fullRoutine);
      setShowPreviewDetail(true);
      if (fullRoutine.isActive) setViewingActiveRoutine(true);
    } catch (error) {
      logger.error('[FitnessScreen] Error fetching routine:', error);
      toast.error('No se pudo cargar la rutina. Intentá de nuevo.');
      setDetailVisible(false);
    } finally {
      setIsLoadingPreviewRoutine(false);
    }
  }, [getToken, setDetailVisible, setViewingActiveRoutine]);

  const handleClosePreviewDetail = useCallback(() => {
    setShowPreviewDetail(false);
    setSelectedPreviewRoutine(null);
    setSelectedFullRoutine(null);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleDiscardDraft = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Descartar borrador',
      message: '¿Querés eliminar el borrador? Esta acción no se puede deshacer.',
      confirmText: 'Descartar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (confirmed) clearDraft();
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
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView contentContainerClassName="pt-8 pb-32" showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View className="px-4 mb-2">
          <Text className="text-3xl font-bold text-white">Fitness</Text>
        </View>

        {/* Tu rutina activa */}
        <View className="px-4 mt-4 mb-3">
          <Text className="text-lg font-bold text-white">Tu rutina activa</Text>
        </View>
        <ActionCard
          ref={cardRef}
          cardState={cardState}
          onGenerate={handleGenerate}
          onViewPlan={handleViewPlan}
          routine={routine}
          isLoadingInitial={isFetchingData}
        />

        {/* Borrador de rutina en proceso — visible siempre que exista */}
        {draft && (
          <View className="mt-4">
            <View className="px-4 mb-3">
              <Text className="text-lg font-bold text-white">Rutina en proceso</Text>
            </View>
            <DraftCard
              draft={draft}
              onContinue={handleOpenCreate}
              onDiscard={handleDiscardDraft}
            />
          </View>
        )}

        {/* Biblioteca de rutinas */}
        <View className="px-4 mt-7 mb-3">
          <Text className="text-lg font-bold text-white">Biblioteca de rutinas</Text>
        </View>
        <View className="px-4 mb-4">
          <SegmentedControl
            options={[{ label: 'IA', value: 'AI' }, { label: 'Manual', value: 'Manual' }]}
            value={libraryTab}
            onChange={setLibraryTab}
            accent="lime"
          />
        </View>

        {isLoadingPreview ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color="#a3e635" />
          </View>
        ) : libraryRoutines.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4"
          >
            {libraryRoutines.map((r) => (
              <RoutineLibraryCard key={r.id} routine={r} onPress={handlePreviewRoutinePress} />
            ))}
          </ScrollView>
        ) : (
          <View className="mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
            <Ionicons
              name={libraryTab === 'AI' ? 'sparkles-outline' : 'barbell-outline'}
              size={28}
              color="#52525b"
            />
            <Text className="text-zinc-400 text-sm mt-2 text-center">
              {libraryTab === 'AI'
                ? 'Todavía no generaste rutinas con IA.'
                : 'Todavía no creaste rutinas manuales.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleViewAllRoutines}
          activeOpacity={0.7}
          className="flex-row items-center justify-center mt-4 py-2"
        >
          <Text className="text-lime-400 text-sm font-semibold mr-1.5">Ver todas</Text>
          <Ionicons name="arrow-forward" size={16} color="#a3e635" />
        </TouchableOpacity>

        {/* Actividad reciente */}
        <View className="px-4 mt-7 mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-white">Actividad reciente</Text>
          {historyPreview.length > 0 && (
            <TouchableOpacity onPress={handleViewAllHistory} className="flex-row items-center">
              <Text className="text-lime-400 text-sm font-semibold mr-1">Ver todo</Text>
              <Ionicons name="chevron-forward" size={16} color="#a3e635" />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingHistory ? (
          <View className="mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
            <ActivityIndicator size="small" color="#a3e635" />
          </View>
        ) : historyPreview.length > 0 ? (
          <RecentActivityCard session={historyPreview[0]} onPress={handleHistorySessionPress} />
        ) : (
          <View className="mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
            <Ionicons name="time-outline" size={28} color="#52525b" />
            <Text className="text-zinc-400 text-sm mt-2 text-center">
              Todavía no registraste entrenamientos.
            </Text>
          </View>
        )}

        {/* Crear nueva rutina */}
        <View ref={createCardRef} collapsable={false} className="px-4 mt-7">
          <TouchableOpacity
            onPress={handleOpenCreate}
            activeOpacity={0.85}
            className="flex-row items-center justify-center py-4 rounded-2xl bg-lime-400"
          >
            <Ionicons name="add-circle-outline" size={22} color="#18181b" />
            <Text className="text-zinc-900 font-bold text-base ml-2">Crear nueva rutina</Text>
          </TouchableOpacity>
        </View>

        {/* Generar rutina con IA */}
        <View className="px-4 mt-3">
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={cardState === 'loading'}
            activeOpacity={0.85}
            className={`flex-row items-center justify-center py-4 rounded-2xl border ${
              cardState === 'loading'
                ? 'bg-zinc-900 border-zinc-800 opacity-60'
                : 'bg-lime-400/10 border-lime-400'
            }`}
          >
            {cardState === 'loading' ? (
              <ActivityIndicator size="small" color="#a3e635" />
            ) : (
              <Ionicons name="sparkles-outline" size={20} color="#a3e635" />
            )}
            <Text className="text-lime-400 font-bold text-base ml-2">
              {cardState === 'loading' ? 'Generando...' : 'Generar rutina con IA'}
            </Text>
          </TouchableOpacity>
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
          onActivate={!routineRef.current?.isActive ? () => handleActivateRoutine(routineRef.current!) : undefined}
          onDelete={() => handleDeleteRoutine(routineRef.current!)}
          offlineInfo={{
            isAvailable: offlineStatus.isAvailable,
            downloadedAt: offlineStatus.downloadedAt,
            pendingCount: offlineStatus.pendingCount,
            failedCount: offlineStatus.failedCount,
            conflictCount: offlineStatus.conflictCount,
            isDownloading: isDownloadingOffline,
            isSyncing: isSyncingOffline,
            error: offlineError,
            isOnline,
          }}
          onDownloadOffline={handleDownloadOffline}
          onSyncOffline={handleSyncOffline}
          onReviewConflict={handleReviewConflict}
        />
      )}

      {/* Overlay de creación de rutina manual */}
      {showCreateRoutine && createCardLayout && (
        <CreateRoutineView
          cardLayout={createCardLayout}
          initialDraft={draft ?? undefined}
          onSaveDraft={saveDraft}
          onClearDraft={clearDraft}
          onClose={() => { setShowCreateRoutine(false); setDetailVisible(false); setIsCreatingRoutine(false); }}
          onRoutineCreated={(r) => {
            setIsCreatingRoutine(false);
            handleRoutineCreated(r);
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
          onActivate={!createdRoutine.isActive ? () => handleActivateRoutine(createdRoutine) : undefined}
          onDelete={() => handleDeleteRoutine(createdRoutine)}
          offlineInfo={{
            isAvailable: offlineStatus.isAvailable,
            downloadedAt: offlineStatus.downloadedAt,
            pendingCount: offlineStatus.pendingCount,
            failedCount: offlineStatus.failedCount,
            conflictCount: offlineStatus.conflictCount,
            isDownloading: isDownloadingOffline,
            isSyncing: isSyncingOffline,
            error: offlineError,
            isOnline,
          }}
          onDownloadOffline={handleDownloadOffline}
          onSyncOffline={handleSyncOffline}
          onReviewConflict={handleReviewConflict}
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
          onActivate={!selectedFullRoutine.isActive ? () => handleActivateRoutine(selectedFullRoutine) : undefined}
          onDelete={() => handleDeleteRoutine(selectedFullRoutine)}
          offlineInfo={selectedFullRoutine.isActive ? {
            isAvailable: offlineStatus.isAvailable,
            downloadedAt: offlineStatus.downloadedAt,
            pendingCount: offlineStatus.pendingCount,
            failedCount: offlineStatus.failedCount,
            conflictCount: offlineStatus.conflictCount,
            isDownloading: isDownloadingOffline,
            isSyncing: isSyncingOffline,
            error: offlineError,
            isOnline,
          } : undefined}
          onDownloadOffline={selectedFullRoutine.isActive ? handleDownloadOffline : undefined}
          onSyncOffline={selectedFullRoutine.isActive ? handleSyncOffline : undefined}
          onReviewConflict={selectedFullRoutine.isActive ? handleReviewConflict : undefined}
        />
      )}

      {/* Modal de resolución de conflicto de sync offline */}
      {conflictOp?.serverRoutine && (
        <ConflictResolutionModal
          visible
          localRoutine={conflictOp.payload.offlineRoutine}
          serverRoutine={conflictOp.serverRoutine}
          onClose={() => setConflictOp(null)}
          onKeepLocal={handleKeepLocal}
          onKeepServer={handleKeepServer}
        />
      )}

      {/* Loading mientras se carga la rutina del preview */}
      {isLoadingPreviewRoutine && selectedPreviewRoutine && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#a3e635" />
            <Text className="text-white mt-4 font-medium">
              Cargando rutina...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

