import { adaptRoutineWithAi, confirmRoutineAdaptation, rejectRoutineAdaptation } from '@/src/services/routine.service';
import { AdaptRoutineDay, AdaptRoutineResponseDto, Routine } from '@/src/types/routine';
import { formatExerciseLoad } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdaptRoutineModalProps {
  /** Indica si el modal está visible */
  visible: boolean;
  /** ID de la rutina que se desea adaptar */
  routineId: string;
  /** Nombre de la rutina original */
  routineName: string;
  /** Callback ejecutado al cerrar el modal (sin aplicar cambios o tras rechazarlos) */
  onClose: () => void;
  /** Callback ejecutado cuando la rutina fue adaptada y confirmada con éxito */
  onRoutineUpdated: (updatedRoutine: Routine) => void;
}

type Step = 'loading' | 'no-changes' | 'has-changes' | 'error';

/** Traducciones para los días de la semana */
const DAY_TRANSLATIONS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

const translateDayName = (day: string) => DAY_TRANSLATIONS[day] ?? day;

export const AdaptRoutineModal: React.FC<AdaptRoutineModalProps> = ({
  visible,
  routineId,
  routineName,
  onClose,
  onRoutineUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [step, setStep] = useState<Step>('loading');
  const [loadingText, setLoadingText] = useState('Analizando tu rutina con IA...');
  const [adaptationData, setAdaptationData] = useState<AdaptRoutineResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  // Inicia la carga del análisis de la rutina
  const loadAnalysis = async () => {
    setStep('loading');
    setErrorMessage('');
    setLoadingText('Analizando tu rutina con IA...');
    
    try {
      const token = await getToken();
      
      // Simulamos etapas del proceso para feedback del usuario
      setTimeout(() => setLoadingText('Comparando con tus afecciones de salud...'), 1000);
      setTimeout(() => setLoadingText('Diseñando alternativas saludables...'), 2000);
      
      const response = await adaptRoutineWithAi(routineId, token);
      setAdaptationData(response);
      
      if (response.hasChanges) {
        setStep('has-changes');
      } else {
        setStep('no-changes');
      }
    } catch (error: any) {
      console.error('[AdaptRoutineModal] Error en análisis:', error);
      setErrorMessage(error.message || 'No se pudo procesar la adaptación. Intentalo de nuevo.');
      setStep('error');
    }
  };

  useEffect(() => {
    if (visible) {
      loadAnalysis();
    } else {
      // Reseteo al cerrar
      setStep('loading');
      setAdaptationData(null);
      setErrorMessage('');
      setIsActionPending(false);
    }
  }, [visible, routineId]);

  // Manejo del botón Confirmar
  const handleConfirm = async () => {
    if (!adaptationData?.pendingAdaptationId) return;
    setIsActionPending(true);
    try {
      const token = await getToken();
      const updatedRoutine = await confirmRoutineAdaptation(adaptationData.pendingAdaptationId, token);
      onRoutineUpdated(updatedRoutine);
      onClose();
    } catch (error: any) {
      console.error('[AdaptRoutineModal] Error al confirmar adaptación:', error);
      alert(error.message || 'Error al aplicar los cambios. Intentalo nuevamente.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Manejo del botón Rechazar / Descartar
  const handleReject = async () => {
    if (!adaptationData?.pendingAdaptationId) {
      onClose();
      return;
    }
    setIsActionPending(true);
    try {
      const token = await getToken();
      await rejectRoutineAdaptation(adaptationData.pendingAdaptationId, token);
      onClose();
    } catch (error: any) {
      console.error('[AdaptRoutineModal] Error al descartar adaptación:', error);
      // Cerramos de todos modos para no bloquear al usuario, informando el problema
      onClose();
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View 
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1 bg-slate-100 dark:bg-slate-950 px-6 justify-between"
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center py-4 border-b border-slate-200 dark:border-slate-800">
          <View className="flex-1 mr-4">
            <Text className="text-xs font-semibold text-lime-600 dark:text-lime-400 uppercase tracking-wider">
              Asistente de Adaptación IA
            </Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-50" numberOfLines={1}>
              {routineName}
            </Text>
          </View>
          {step !== 'loading' && !isActionPending && (
            <TouchableOpacity 
              onPress={step === 'has-changes' ? handleReject : onClose}
              className="bg-slate-200 dark:bg-slate-900 p-2 rounded-full"
            >
              <Ionicons name="close" size={20} className="text-slate-700 dark:text-slate-300" />
            </TouchableOpacity>
          )}
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <View className="flex-1 py-4">
          {/* STEP: LOADING */}
          {step === 'loading' && (
            <View className="flex-1 justify-center items-center gap-4">
              <ActivityIndicator size="large" color="#a3e635" />
              <Text className="text-slate-600 dark:text-slate-400 text-center font-medium animate-pulse">
                {loadingText}
              </Text>
            </View>
          )}

          {/* STEP: ERROR */}
          {step === 'error' && (
            <View className="flex-1 justify-center items-center gap-6 px-4">
              <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 items-center justify-center">
                <Ionicons name="alert-circle" size={36} className="text-red-500" />
              </View>
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold text-center">
                  Ocurrió un inconveniente
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm">
                  {errorMessage}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={loadAnalysis}
                className="bg-lime-400 py-3 px-6 rounded-full"
              >
                <Text className="text-slate-950 font-bold text-center">
                  Reintentar análisis
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: NO CHANGES */}
          {step === 'no-changes' && adaptationData && (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="items-center py-6 gap-3">
                <View className="w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-950/30 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={36} className="text-lime-500" />
                </View>
                <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold text-center">
                  ¡Tu rutina está óptima!
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm px-4">
                  El análisis de IA determinó que tu rutina no requiere ajustes de salud o seguridad en este momento.
                </Text>
              </View>

              <Text className="text-slate-900 dark:text-slate-50 font-bold text-base mb-3 mt-4">
                Vista previa de la rutina
              </Text>
              {adaptationData.days.map((day) => (
                <RenderDayPreview key={day.dayOfWeek} day={day} />
              ))}
            </ScrollView>
          )}

          {/* STEP: HAS CHANGES */}
          {step === 'has-changes' && adaptationData && (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Motivos del Ajuste */}
              <View className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="shield-checkmark" size={20} className="text-amber-600 dark:text-amber-500" />
                  <Text className="text-amber-800 dark:text-amber-400 font-bold text-base">
                    Ajustes de salud recomendados
                  </Text>
                </View>
                <Text className="text-slate-600 dark:text-slate-400 text-xs mb-3">
                  La IA detectó ejercicios que podrían comprometer tus articulaciones o salud actual, y propone reemplazarlos por alternativas seguras:
                </Text>
                
                <View className="gap-3">
                  {adaptationData.motives.map((motive, idx) => (
                    <View key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                      <Text className="text-red-500 dark:text-red-400 font-bold text-sm line-through">
                        {motive.exerciseName}
                      </Text>
                      <View className="flex-row items-center gap-1 my-1">
                        <Ionicons name="arrow-down" size={12} className="text-lime-500" />
                        <Text className="text-slate-400 text-xs font-semibold">Reemplazado por alternativa segura</Text>
                      </View>
                      <Text className="text-slate-700 dark:text-slate-300 text-xs mt-1 leading-relaxed">
                        {motive.reason}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Vista previa de los cambios propuestos */}
              <Text className="text-slate-900 dark:text-slate-50 font-bold text-base mb-3">
                Nueva propuesta de rutina
              </Text>
              {adaptationData.days.map((day) => (
                <RenderDayPreview key={day.dayOfWeek} day={day} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* BOTTOM ACTIONS BAR */}
        <View className="py-4 border-t border-slate-200 dark:border-slate-800 gap-3">
          {step === 'no-changes' && (
            <TouchableOpacity 
              onPress={onClose}
              className="bg-zinc-950 dark:bg-zinc-50 py-4 rounded-full"
            >
              <Text className="text-white dark:text-zinc-950 font-bold text-center">
                Entendido
              </Text>
            </TouchableOpacity>
          )}

          {step === 'has-changes' && (
            <View className="flex-row gap-3">
              <TouchableOpacity 
                disabled={isActionPending}
                onPress={handleReject}
                className="flex-1 bg-slate-200 dark:bg-slate-900 py-4 rounded-full"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-center">
                  Descartar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={isActionPending}
                onPress={handleConfirm}
                className="flex-1 bg-lime-400 py-4 rounded-full flex-row justify-center items-center"
              >
                {isActionPending ? (
                  <ActivityIndicator size="small" color="#090d16" />
                ) : (
                  <Text className="text-slate-950 font-bold text-center">
                    Confirmar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'error' && (
            <TouchableOpacity 
              onPress={onClose}
              className="bg-slate-200 dark:bg-slate-900 py-4 rounded-full"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-center">
                Volver
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Sub-componente interno para renderizar el preview de un día
const RenderDayPreview = ({ day }: { day: AdaptRoutineDay }) => {
  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 gap-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-slate-900 dark:text-slate-50 font-bold text-sm">
          {translateDayName(day.dayOfWeek)}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs">
          {day.approxTimeSession} min aprox.
        </Text>
      </View>

      <View className="h-[1px] bg-slate-100 dark:bg-slate-800/80" />

      <View className="gap-3">
        {day.exercises.map((exercise) => {
          const formattedReps = exercise.repType === 'Timed' 
            ? `${exercise.durationSeconds}s`
            : `${exercise.minRep}-${exercise.maxRep} reps`;

          return (
            <View key={exercise.order} className="flex-row justify-between items-center py-1">
              <View className="flex-1 mr-4">
                <Text className="text-slate-800 dark:text-slate-200 text-sm font-semibold" numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {exercise.sets} sets × {formattedReps} | Descanso: {exercise.rest}s
                </Text>
              </View>
              {exercise.loadType && (
                <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <Text className="text-slate-600 dark:text-slate-300 text-xs font-bold">
                    {formatExerciseLoad(exercise)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
