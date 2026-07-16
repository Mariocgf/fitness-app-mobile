import { IconTile } from '@/src/components/common/IconTile';
import { formatTimeSpan } from '@/src/utils/format.utils';
import { effortLabelFor } from '@/src/utils/rpe';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EffortSection } from './EffortSection';

const LIME = '#a3e635'; // lime-400

interface SummaryStats {
  exercisesDone: number;
  exercisesTotal: number;
  setsDone: number;
  setsTotal: number;
  repsDone: number;
  repsTotal: number;
  /** `null` cuando no se registró ni un esfuerzo en toda la sesión. */
  avgRpe: number | null;
}

/**
 * Bloque de esfuerzo de la ÚLTIMA serie. Solo aparece cuando la sesión terminó por
 * completarla (esa serie salta directo al resumen y nunca tuvo descanso, así que es
 * el único momento en que el usuario puede puntuarla).
 */
interface PendingEffort {
  /** Nombre del ejercicio de esa última serie. */
  exerciseName: string;
  rpe: number | null;
  onRpeChange: (value: number) => void;
  onAdjustLoad: () => void;
  canAdjustLoad: boolean;
  isAdjustingLoad: boolean;
  isOffline: boolean;
}

interface SummaryPhaseProps {
  globalTime: number;
  stats: SummaryStats;
  /** Nombre de la rutina entrenada (ej. "Fuerza Pro - Nivel Intermedio") */
  routineName?: string;
  /** Etiqueta cruda del próximo día de la rutina (ej. "Día 2 - Espalda") */
  nextSessionDay?: string;
  /** Si falta puntuar la última serie (sin descanso previo). */
  pendingEffort?: PendingEffort;
  onSave: () => void;
}

/**
 * Toma solo el día de la etiqueta del próximo día y descarta el grupo muscular.
 * El backend entrega "Día 2 - Espalda"; mostramos únicamente "Día 2".
 */
const formatNextSessionDay = (raw: string): string =>
  raw.split(/\s+[-–]\s+/)[0].trim();

interface StatCellProps {
  label: string;
  /** `null` se muestra como "—": la ausencia de dato no es un cero. */
  value: number | string | null;
  /** Total opcional; si se omite, se muestra solo el valor (ej. esfuerzo promedio) */
  total?: number;
}

/** Celda del grid 2×2 de estadísticas: label arriba, valor (+ total atenuado) abajo. */
const StatCell: React.FC<StatCellProps> = ({ label, value, total }) => (
  <View className="flex-1 items-center py-5">
    <Text className="text-zinc-500 text-sm mb-2">{label}</Text>
    {/* El esfuerzo llega como etiqueta ("Al fallo"), no como número: se auto-ajusta
        para que una palabra larga entre en la celda igual que un dígito. */}
    <Text adjustsFontSizeToFit numberOfLines={1} className="text-white text-3xl font-bold px-2">
      {value ?? '—'}
      {total !== undefined && (
        <Text className="text-zinc-600 font-bold"> / {total}</Text>
      )}
    </Text>
  </View>
);

export const SummaryPhase: React.FC<SummaryPhaseProps> = ({
  globalTime,
  stats,
  routineName,
  nextSessionDay,
  pendingEffort,
  onSave,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-zinc-950"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
      >
        {/* Ícono celebratorio */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full items-center justify-center border border-zinc-800 bg-zinc-900">
            <View className="absolute w-24 h-24 rounded-full bg-lime-400/10" />
            <Ionicons name="barbell-outline" size={40} color={LIME} />
          </View>
        </View>

        {/* Título + nombre de rutina */}
        <Text className="text-white text-3xl font-bold text-center">Rutina completada</Text>
        {routineName && (
          <Text className="text-zinc-400 text-base text-center mt-1" numberOfLines={1}>
            {routineName}
          </Text>
        )}

        {/* Tiempo total */}
        <Text className="text-white text-6xl font-bold text-center mt-6" adjustsFontSizeToFit numberOfLines={1}>
          {formatTimeSpan(globalTime)}
        </Text>
        <Text className="text-zinc-400 text-base text-center mt-2">
          {stats.exercisesDone} {stats.exercisesDone === 1 ? 'ejercicio completado' : 'ejercicios completados'}
        </Text>

        {/* Esfuerzo de la última serie: no tuvo descanso, así que se pregunta acá.
            Si el usuario toca "Continuar" sin elegir nada, esa serie va como `null`. */}
        {pendingEffort && (
          <View className="bg-zinc-900 rounded-3xl mt-8 p-5">
            <EffortSection
              title={`¿Cómo te fue la última serie? · ${pendingEffort.exerciseName}`}
              rpe={pendingEffort.rpe}
              onRpeChange={pendingEffort.onRpeChange}
              onAdjustLoad={pendingEffort.onAdjustLoad}
              canAdjustLoad={pendingEffort.canAdjustLoad}
              isAdjustingLoad={pendingEffort.isAdjustingLoad}
              isOffline={pendingEffort.isOffline}
            />
          </View>
        )}

        {/* Grid de estadísticas 2×2 */}
        <View className="bg-zinc-900 rounded-3xl mt-8 overflow-hidden">
          <View className="flex-row">
            <StatCell label="Ejercicios" value={stats.exercisesDone} total={stats.exercisesTotal} />
            <View className="w-px bg-zinc-800" />
            <StatCell label="Series" value={stats.setsDone} total={stats.setsTotal} />
          </View>
          <View className="h-px bg-zinc-800" />
          <View className="flex-row">
            <StatCell label="Repeticiones" value={stats.repsDone} total={stats.repsTotal} />
            <View className="w-px bg-zinc-800" />
            <StatCell label="Esfuerzo promedio" value={effortLabelFor(stats.avgRpe)} />
          </View>
        </View>

        {/* Próxima sesión */}
        {nextSessionDay && (
          <View className="bg-zinc-900 rounded-2xl mt-4 px-4 py-4 flex-row items-center gap-4">
            <IconTile name="calendar-outline" color={LIME} />
            <View className="flex-1">
              <Text className="text-zinc-500 text-sm">Próxima sesión</Text>
              <Text className="text-white text-lg font-semibold mt-0.5">
                {formatNextSessionDay(nextSessionDay)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View className="px-6 pt-4">
        <TouchableOpacity
          className="bg-lime-400 w-full h-14 rounded-2xl items-center justify-center"
          onPress={onSave}
        >
          <Text className="text-zinc-900 font-semibold text-base">Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
