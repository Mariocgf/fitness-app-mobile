import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { RoutineDetailView, CardLayout } from '@/src/components/features/routine/RoutineDetailView';
import { Routine } from '@/src/types/routine';
import { generateRoutine, getActiveRoutine, regenerateRoutine } from '@/src/services/routine.service';
import { getActiveModules } from '@/src/services/module.service';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [cardState, setCardState] = useState<CardState>('initial');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [showRoutineDetail, setShowRoutineDetail] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const cardRef = useRef<View>(null);

  const { setDetailVisible, setActions } = useRoutineDetailContext();
  
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');

  /** Obtiene el primer nombre del usuario autenticado */
  const userName = user?.firstName ?? 'Usuario';

  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. Carga optimista de la rutina cacheada
        const storedRoutine = await AsyncStorage.getItem('@user_routine');
        if (storedRoutine) {
          setRoutine(JSON.parse(storedRoutine));
          setCardState('success');
        }

        const token = await getToken();
        if (!token) return;

        // 2. Ejecutar requests en paralelo
        const [modulesResult, routineResult] = await Promise.allSettled([
          getActiveModules(token),
          getActiveRoutine(token)
        ]);

        // 3. Procesar Módulos y guardar en caché
        if (modulesResult.status === 'fulfilled') {
          await AsyncStorage.setItem('@active_modules', JSON.stringify(modulesResult.value));
        }

        // 4. Procesar Rutina
        if (routineResult.status === 'fulfilled') {
          const activeRoutine = routineResult.value;
          if (activeRoutine) {
            setRoutine(activeRoutine);
            await AsyncStorage.setItem('@user_routine', JSON.stringify(activeRoutine));
            setCardState('success');
          } else {
            // 404: Sin rutina activa
            await AsyncStorage.removeItem('@user_routine');
            setRoutine(null);
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
  }, []);

  /** Mide la posición de la card en pantalla y abre la vista expandida */
  const handleViewPlan = useCallback(() => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      setCardLayout({ x, y, width, height });
      setShowRoutineDetail(true);
      setDetailVisible(true);
      setActions({
        onRegenerate: async () => {
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
        },
        onChangeExercises: () => {
          // Placeholder: lógica de cambio de ejercicios pendiente
        },
      });
    });
  }, [setDetailVisible, setActions]);

  const handleCloseDetail = useCallback(() => {
    setShowRoutineDetail(false);
    setDetailVisible(false);
    setActions(null);
  }, [setDetailVisible, setActions]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <ScrollView contentContainerClassName="pt-6 pb-10">
        <GreetingHeader userName={userName} avatarUrl={user?.imageUrl} />
        
        <ActionCard
          ref={cardRef}
          cardState={cardState}
          onGenerate={handleGenerate}
          onViewPlan={handleViewPlan}
          routine={routine}
          isLoadingInitial={isFetchingData}
        />
      </ScrollView>

      {/* Vista expandida: se anima desde la posición de la card */}
      {showRoutineDetail && routine && cardLayout && (
        <RoutineDetailView
          routine={routine}
          onClose={handleCloseDetail}
          cardLayout={cardLayout}
          isGenerating={cardState === 'loading'}
        />
      )}
    </SafeAreaView>
  );
}
