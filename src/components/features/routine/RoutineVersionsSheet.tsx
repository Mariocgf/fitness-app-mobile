import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { VersionBadge } from '@/src/components/features/routine/routine-detail-shared';
import { useRoutineVersions } from '@/src/hooks/useRoutineVersions';
import { RoutineVersionSummary } from '@/src/types/routine';
import { formatRelativeDay } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface RoutineVersionsSheetProps {
  visible: boolean;
  routineId: string;
  /** Versión actualmente en preview, para resaltar su fila. */
  selectedVersionId?: string | null;
  onClose: () => void;
  onSelectVersion: (version: RoutineVersionSummary) => void;
}

/**
 * Historial de versiones de una rutina (`GET /{id}/versions`). Lista cada versión
 * con badges "En uso" (`isActive`) y "Última" (`isLatest`), fecha y motivo del
 * cambio. Al tocar una, el detalle de rutina la muestra en modo preview.
 */
export const RoutineVersionsSheet: React.FC<RoutineVersionsSheetProps> = ({
  visible,
  routineId,
  selectedVersionId,
  onClose,
  onSelectVersion,
}) => {
  const { data, isLoading, error, reload } = useRoutineVersions(routineId, visible);

  return (
    <BottomSheetModal visible={visible} onClose={onClose} height="80%">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
          <View className="flex-1 pr-3">
            <Text className="text-white text-xl font-bold">Versiones</Text>
            <Text className="text-zinc-500 text-xs mt-0.5">
              Tocá una versión para verla, activarla o restaurarla
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="close" size={20} className="text-white" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a3e635" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={40} className="text-red-400" />
            <Text className="text-white text-base font-medium mt-3 text-center">{error}</Text>
            <TouchableOpacity onPress={reload} className="mt-4 bg-lime-400 px-6 py-3 rounded-xl">
              <Text className="text-zinc-900 font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : !data || data.versions.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="layers-outline" size={40} className="text-zinc-600" />
            <Text className="text-zinc-400 text-sm mt-3 text-center">
              Esta rutina todavía no tiene historial de versiones.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {data.versions.map((v) => {
              const isSelected = v.id === selectedVersionId;
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.7}
                  onPress={() => onSelectVersion(v)}
                  className={`flex-row items-center rounded-2xl p-4 mb-3 border ${
                    isSelected ? 'bg-lime-400/10 border-lime-400/40' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-white text-base font-bold">Versión {v.versionNumber}</Text>
                      {v.isActive && <VersionBadge label="En uso" tone="lime" />}
                      {v.isLatest && <VersionBadge label="Última" tone="lime" />}
                    </View>
                    <Text className="text-zinc-500 text-xs mt-1">
                      {formatRelativeDay(new Date(v.createdAt))}
                      {v.changeReason ? ` · ${v.changeReason}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} className="text-zinc-500" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </BottomSheetModal>
  );
};
