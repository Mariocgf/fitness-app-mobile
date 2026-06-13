import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { fetchTrainingHistory } from '@/src/services/training-history.service';
import { TrainingHistorySession } from '@/src/types/training-history';

import { TrainingHistoryListCard } from './TrainingHistoryListCard';

interface SessionComparePickerProps {
  /** ID de la sesión actual a excluir de la lista */
  excludeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const PAGE_SIZE = 10;

/**
 * Bottom sheet para elegir la sesión contra la cual comparar.
 * El padre controla el render condicional: este componente asume que ya está montado.
 */
export function SessionComparePicker({ excludeId, onSelect, onClose }: SessionComparePickerProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [sessions, setSessions] = useState<TrainingHistorySession[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getTokenRef.current();
      const result = await fetchTrainingHistory({ fromDate: null, toDate: null, routineId: null, targetMuscle: null }, 1, PAGE_SIZE, token);
      setSessions(result.items.filter((s) => s.id !== excludeId));
      setTotalCount(result.totalCount);
      setPage(1);
    } catch {
      // Silencioso — la lista queda vacía con el empty state
    } finally {
      setIsLoading(false);
    }
  }, [excludeId]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || page * PAGE_SIZE >= totalCount) return;
    setIsLoadingMore(true);
    try {
      const token = await getTokenRef.current();
      const result = await fetchTrainingHistory({ fromDate: null, toDate: null, routineId: null, targetMuscle: null }, page + 1, PAGE_SIZE, token);
      setSessions((prev) => [...prev, ...result.items.filter((s) => s.id !== excludeId)]);
      setPage((p) => p + 1);
    } catch {
      // Silencioso — el usuario puede intentar scrollear de nuevo
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, totalCount, excludeId]);

  useEffect(() => {
    loadFirstPage();
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = useCallback((session: TrainingHistorySession) => {
    onSelect(session.id);
  }, [onSelect]);

  const hasMore = page * PAGE_SIZE < totalCount;

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#a3e635" />
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <Text className="text-slate-500 dark:text-slate-400 text-base text-center">
          No hay otras sesiones disponibles para comparar.
        </Text>
      </View>
    );
  };

  return (
    <BottomSheetModal visible onClose={onClose} height="75%">
      <View className="px-4 pt-5 pb-2">
        <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
          Comparar con...
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Elegí una sesión anterior para comparar métricas
        </Text>
      </View>

      <FlatList
        data={isLoading ? [] : sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexGrow: 1 }}
        renderItem={({ item }) => (
          <TrainingHistoryListCard session={item} onPress={handlePress} />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#a3e635" style={{ marginVertical: 8 }} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}
