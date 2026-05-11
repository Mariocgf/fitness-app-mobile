import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { GreetingHeader } from '@/src/components/features/home/GreetingHeader';
import { ActionCard, CardState } from '@/src/components/features/home/ActionCard';
import { RoutineDetailModal } from '@/src/components/features/routine/RoutineDetailModal';
import { Routine } from '@/src/types/routine';
import { generateRoutine, getActiveRoutine } from '@/src/services/routine.service';
import { getActiveModules } from '@/src/services/module.service';
import { useThemeColor } from '@/src/hooks/use-theme-color';

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [cardState, setCardState] = useState<CardState>('initial');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isFabMenuVisible, setIsFabMenuVisible] = useState(false);
  
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

  const handleViewPlan = () => {
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GreetingHeader userName={userName} />
        
        <ActionCard 
          cardState={cardState}
          onGenerate={handleGenerate}
          onViewPlan={handleViewPlan}
          routine={routine}
          isLoadingInitial={isFetchingData}
        />
      </ScrollView>

      <RoutineDetailModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        routine={routine}
      />

      {/* Menu desplegable del FAB */}
      {isFabMenuVisible && (
        <View className="absolute bottom-24 right-6 bg-zinc-800 rounded-2xl p-2 shadow-lg border border-zinc-700">
          <TouchableOpacity 
            className="flex-row items-center p-3"
            onPress={() => {
              setIsFabMenuVisible(false);
              handleGenerate();
            }}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Generar rutina</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB - Botón + */}
      <TouchableOpacity 
        style={{ elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-lime-300 rounded-full items-center justify-center"
        onPress={() => setIsFabMenuVisible(!isFabMenuVisible)}
      >
        <Ionicons name={isFabMenuVisible ? "close" : "add"} size={32} color="black" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  }
});
