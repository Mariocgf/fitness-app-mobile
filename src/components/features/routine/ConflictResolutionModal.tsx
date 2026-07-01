import { Routine } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ConflictResolutionModalProps {
  /** Indica si el modal está visible */
  visible: boolean;
  /** Versión que el usuario editó sin conexión */
  localRoutine: Routine;
  /** Versión actual del servidor (cambió en otro dispositivo) */
  serverRoutine: Routine;
  /** Cierra sin resolver (el conflicto queda pendiente) */
  onClose: () => void;
  /** El usuario fuerza su versión local sobre la del servidor */
  onKeepLocal: () => Promise<void> | void;
  /** El usuario descarta lo local y se queda con la del servidor */
  onKeepServer: () => Promise<void> | void;
}

const countExercises = (routine: Routine): number =>
  routine.days.reduce((acc, day) => acc + day.exercises.length, 0);

type PendingAction = 'local' | 'server' | null;

/**
 * Resolución de un conflicto de rutina offline. Muestra "tu versión vs la del
 * servidor" (resumen, no diff profundo) y deja que el usuario elija con cuál
 * quedarse. Sigue la política del backend: ni local-wins ni server-wins
 * automático, el usuario decide.
 */
export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  localRoutine,
  serverRoutine,
  onClose,
  onKeepLocal,
  onKeepServer,
}) => {
  const [pending, setPending] = useState<PendingAction>(null);

  const run = async (action: PendingAction, fn: () => Promise<void> | void) => {
    if (pending) return;
    setPending(action);
    try {
      await fn();
    } finally {
      setPending(null);
    }
  };

  const isBusy = pending != null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-5">
          {/* Header */}
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
            <Text className="text-zinc-50 text-base font-bold">Conflicto de sincronización</Text>
          </View>
          <Text className="text-zinc-400 text-xs leading-relaxed mb-4">
            Editaste esta rutina sin conexión, pero cambió en otro dispositivo. ¿Cuál querés mantener?
          </Text>

          {/* Card: tu versión */}
          <VersionCard
            label="Tu versión (offline)"
            accent="#a3e635"
            routine={localRoutine}
          />

          <View className="h-3" />

          {/* Card: versión del servidor */}
          <VersionCard
            label="Versión del servidor"
            accent="#60a5fa"
            routine={serverRoutine}
          />

          {/* Acciones */}
          <View className="mt-5 gap-2.5">
            <TouchableOpacity
              disabled={isBusy}
              activeOpacity={0.8}
              onPress={() => run('local', onKeepLocal)}
              className="rounded-full bg-lime-400 py-3.5 flex-row justify-center items-center"
              style={{ opacity: isBusy ? 0.6 : 1 }}
            >
              {pending === 'local' ? (
                <ActivityIndicator size="small" color="#0a0a0a" />
              ) : (
                <Text className="text-zinc-950 font-bold">Mantener la mía</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isBusy}
              activeOpacity={0.8}
              onPress={() => run('server', onKeepServer)}
              className="rounded-full border border-white/15 bg-white/5 py-3.5 flex-row justify-center items-center"
              style={{ opacity: isBusy ? 0.6 : 1 }}
            >
              {pending === 'server' ? (
                <ActivityIndicator size="small" color="#e4e4e7" />
              ) : (
                <Text className="text-zinc-200 font-bold">Usar la del servidor</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isBusy}
              activeOpacity={0.7}
              onPress={onClose}
              className="py-2 items-center"
            >
              <Text className="text-zinc-500 text-xs font-semibold">Decidir después</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const VersionCard = ({
  label,
  accent,
  routine,
}: {
  label: string;
  accent: string;
  routine: Routine;
}) => (
  <View className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
    <View className="flex-row items-center gap-2 mb-1.5">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
      <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </Text>
    </View>
    <Text className="text-zinc-50 text-sm font-bold" numberOfLines={1}>
      {routine.name}
    </Text>
    <Text className="text-zinc-500 text-xs mt-0.5">
      {routine.versionNumber != null ? `v${routine.versionNumber} · ` : ''}
      {routine.days.length} {routine.days.length === 1 ? 'día' : 'días'} ·{' '}
      {countExercises(routine)} ejercicios
    </Text>
  </View>
);
