import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { CardLayout, RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { useRoutineDraft } from '@/src/hooks/useRoutineDraft';
import { generateRoutine, getActiveRoutine, regenerateRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { Routine } from '@/src/types/routine';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FitnessScreen() {
  const { getToken } = useAuth();

  /* ── Estado de rutina ─────────────────────────────────────────────────── */
  const [cardState, setCardState] = useState<CardState>('initial');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  /* ── Estado de vistas ─────────────────────────────────────────────────── */
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout | null>(null);
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);

  const cardRef = useRef<View>(null);
  const createCardRef = useRef<View>(null);
  const [createCardLayout, setCreateCardLayout] = useState<CardLayout | null>(null);

  /** Rutina recién creada manualmente (para mostrar en RoutineDetailView tras guardar) */
  const [createdRoutine, setCreatedRoutine] = useState<Routine | null>(null);

  const { setOnCreateRoutine, setDetailVisible, activeRoutine, setActiveRoutine } = useRoutineDetailContext();
  const activeRoutineRef = useRef(activeRoutine);
  activeRoutineRef.current = activeRoutine;

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
    cardRef.current?.measureInWindow((x, y, width, height) => {
      setCardLayout({ x, y, width, height });
      setShowRoutineDetail(true);
      setDetailVisible(true);
    });
  }, [setDetailVisible]);

  const handleCloseDetail = useCallback(() => {
    setShowRoutineDetail(false);
    setDetailVisible(false);
  }, [setDetailVisible]);

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
    setRoutine(updated);
    setActiveRoutine(updated);
    try {
      await AsyncStorage.setItem('@user_routine', JSON.stringify(updated));
    } catch (error) {
      console.error('No se pudo cachear la rutina actualizada:', error);
    }
  }, [setActiveRoutine]);

  const handleOpenCreate = useCallback(() => {
    createCardRef.current?.measureInWindow((x, y, width, height) => {
      setCreateCardLayout({ x, y, width, height });
      setShowCreateRoutine(true);
      setDetailVisible(true);
    });
  }, [setDetailVisible]);

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
    createCardRef.current?.measureInWindow((x, y, width, height) => {
      setCreateCardLayout({ x, y, width, height });
    });
  }, []);

  const { draft, saveDraft, clearDraft } = useRoutineDraft();

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
      <ScrollView contentContainerClassName="pt-8 pb-10">
        {/* Título */}
        <View className="px-4 mb-1">
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Fitness</Text>
        </View>

        {/* Sub-sección: Rutina */}
        <View className="px-4 mt-6 mb-2">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Rutina</Text>
        </View>
        <ActionCard
          ref={cardRef}
          cardState={cardState}
          onGenerate={handleGenerate}
          onViewPlan={handleViewPlan}
          routine={routine}
          isLoadingInitial={isFetchingData}
        />

        {/* Sub-sección: Crear rutina manual */}
        <View className="px-4 mt-6 mb-2">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Crear rutina manual</Text>
        </View>
        <View ref={createCardRef} collapsable={false}>
          {draft ? (
            <DraftCard
              draft={draft}
              onContinue={handleOpenCreate}
              onDiscard={handleDiscardDraft}
            />
          ) : (
            <EmptyCreateCard onPress={handleOpenCreate} />
          )}
        </View>
      </ScrollView>

      {/* Vista expandida de rutina activa */}
      {showRoutineDetail && routine && cardLayout && (
        <RoutineDetailView
          routine={routine}
          onClose={handleCloseDetail}
          cardLayout={cardLayout}
          isGenerating={cardState === 'loading'}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
        />
      )}

      {/* Overlay de creación de rutina manual */}
      {showCreateRoutine && createCardLayout && (
        <CreateRoutineView
          cardLayout={createCardLayout}
          initialDraft={draft ?? undefined}
          onSaveDraft={saveDraft}
          onClearDraft={clearDraft}
          onClose={() => { setShowCreateRoutine(false); setDetailVisible(false); }}
          onRoutineCreated={handleRoutineCreated}
        />
      )}

      {/* Detalle de rutina recién creada manualmente */}
      {createdRoutine && createCardLayout && (
        <RoutineDetailView
          routine={createdRoutine}
          onClose={() => { setCreatedRoutine(null); setDetailVisible(false); }}
          cardLayout={createCardLayout}
          readOnly={!createdRoutine?.isActive}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
        />
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
