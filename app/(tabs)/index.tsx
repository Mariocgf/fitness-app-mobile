import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { DietCard } from '@/src/components/features/home/DietCard';
import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { CreateRoutineView } from '@/src/components/features/routine/CreateRoutineView';
import { CardLayout, RoutineDetailView } from '@/src/components/features/routine/RoutineDetailView';
import { getActiveModules } from '@/src/services/module.service';
import { generateRoutine, getActiveRoutine, regenerateRoutine } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { Routine, RoutineDay } from '@/src/types/routine';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [cardState, setCardState] = useState<CardState>('initial');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const cardRef = useRef<View>(null);
  const [showEditView, setShowEditView] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const { setDetailVisible, setOnGenerateRoutine, activeRoutine, setActiveRoutine, setViewingActiveRoutine } = useRoutineDetailContext();
  // Fondo base según colors.md: slate-100 (light) / slate-950 (dark)

  /** Obtiene el primer nombre del usuario autenticado */
  const userName = user?.firstName ?? 'Usuario';

  /** Carga inicial: solo al montar el componente */
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. Carga optimista desde AsyncStorage
        const storedRoutine = await AsyncStorage.getItem('@user_routine');
        if (storedRoutine) {
          const parsed = JSON.parse(storedRoutine) as Routine;
          setRoutine(parsed);
          setActiveRoutine(parsed);
          setCardState('success');
        }

        const token = await getToken();
        if (!token) return;

        // 2. Fetch en paralelo (primera carga real)
        const [modulesResult, routineResult] = await Promise.allSettled([
          getActiveModules(token),
          getActiveRoutine(token)
        ]);

        if (modulesResult.status === 'fulfilled') {
          await AsyncStorage.setItem('@active_modules', JSON.stringify(modulesResult.value));
        }

        if (routineResult.status === 'fulfilled') {
          const fetched = routineResult.value;
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
        }
      } catch (error) {
        console.error('Error inicializando datos en Home:', error);
      } finally {
        setIsFetchingData(false);
      }
    };

    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sincroniza el estado local cuando la rutina cambia desde otro tab */
  useEffect(() => {
    if (activeRoutine) {
      setRoutine(activeRoutine);
      setCardState('success');
    } else if (activeRoutine === null && !isFetchingData) {
      setRoutine(null);
      setCardState('initial');
    }
  }, [activeRoutine]);

  /** Mide la posición de la card en pantalla y abre la vista expandida */
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

  /** Convierte una Routine del backend al formato RoutineDraft del editor */
  const routineToDraft = useCallback((r: Routine) => {
    const DAYS_VALUE_MAP: Record<string, string> = {
      'Lunes': 'monday', 'Martes': 'tuesday', 'Miércoles': 'wednesday',
      'Jueves': 'thursday', 'Viernes': 'friday', 'Sábado': 'saturday', 'Domingo': 'sunday',
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
          weightKg: ex.weight && ex.weight !== '0' ? parseFloat(ex.weight) : null,
        })),
      })),
    };
  }, []);

  const handleOpenEdit = useCallback((r: Routine) => {
    setEditingRoutine(r);
    setShowRoutineDetail(false);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
    setShowEditView(true);
  }, [setDetailVisible, setViewingActiveRoutine]);

  /** Regenera la rutina (lo dispara el FAB vía RoutineDetailView). */
  const handleRegenerate = useCallback(async () => {
    setCardState('loading');
    try {
      const token = await getToken();
      const newRoutine = await regenerateRoutine(token);
      setRoutine(newRoutine);
      await AsyncStorage.setItem('@user_routine', JSON.stringify(newRoutine));
      setCardState('success');
    } catch (error) {
      console.error(error);
      setCardState('success'); // Vuelve al estado normal si falla
    }
  }, [getToken]);

  /** Sincroniza el estado y la caché cuando un swap aplicado actualiza la rutina. */
  const handleRoutineUpdated = useCallback(async (updated: Routine) => {
    setRoutine(updated);
    try {
      await AsyncStorage.setItem('@user_routine', JSON.stringify(updated));
    } catch (error) {
      console.error('No se pudo cachear la rutina actualizada:', error);
    }
  }, []);

  const handleGenerate = async () => {
    setCardState('loading');
    try {
      const token = await getToken();
      const newRoutine = await generateRoutine(token);
      setRoutine(newRoutine);
      await AsyncStorage.setItem('@user_routine', JSON.stringify(newRoutine));
      setCardState('success');
    } catch (error) {
      console.error(error);
      setCardState('initial');
    }
  };

  const handleGenerateRef = useRef(handleGenerate);
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  });

  useEffect(() => {
    setOnGenerateRoutine(() => () => handleGenerateRef.current());
    return () => setOnGenerateRoutine(null);
  }, [setOnGenerateRoutine]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView contentContainerClassName="pt-8 pb-10">
        <GreetingHeader userName={userName} avatarUrl={user?.imageUrl} />

        {cardState !== 'success' ? (
          <>
            {/* Sección: sin planes activos */}
            {!isFetchingData && (
              <View className="px-4 mb-2">
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  ¡Comienza ahora!
                </Text>
              </View>
            )}
            <ActionCard
              ref={cardRef}
              cardState={cardState}
              onGenerate={handleGenerate}
              onViewPlan={handleViewPlan}
              routine={routine}
              isLoadingInitial={isFetchingData}
            />
            <DietCard />
          </>
        ) : (
          <>
            {/* Sección: dieta */}
            <View className="px-4 mb-2">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
                ¡Comienza ahora!
              </Text>
            </View>
            <DietCard />
            {/* Sección: planes activos */}
            <View className="px-4 mt-6 mb-2">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Planes activos
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
          </>
        )}
      </ScrollView>

      {/* Vista expandida: se anima desde la posición de la card */}
      {showRoutineDetail && routine && cardLayout && (
        <RoutineDetailView
          routine={routine}
          onClose={handleCloseDetail}
          cardLayout={cardLayout}
          isGenerating={cardState === 'loading'}
          onRegenerate={handleRegenerate}
          onRoutineUpdated={handleRoutineUpdated}
          onEdit={routine.source === 'Manual' ? () => handleOpenEdit(routine) : undefined}
        />
      )}

      {/* Editor de rutina en modo edición */}
      {showEditView && editingRoutine && (
        <CreateRoutineView
          initialDraft={routineToDraft(editingRoutine)}
          editingRoutineId={editingRoutine.id}
          onClose={() => { setShowEditView(false); setEditingRoutine(null); }}
          onRoutineCreated={async (r: Routine) => {
            const wasActive = editingRoutine?.isActive ?? false;
            setShowEditView(false);
            setEditingRoutine(null);
            const updated = wasActive ? { ...r, isActive: true } : r;
            setRoutine(updated);
            setActiveRoutine(updated);
            try {
              await AsyncStorage.setItem('@user_routine', JSON.stringify(updated));
            } catch {}
            if (wasActive) {
              cardRef.current?.measureInWindow((x, y, width, height) => {
                setCardLayout({ x, y, width, height });
                setShowRoutineDetail(true);
                setDetailVisible(true);
              });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
