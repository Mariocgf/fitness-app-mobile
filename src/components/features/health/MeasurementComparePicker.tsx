import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { useMeasurementHistory } from '@/src/hooks/useMeasurementHistory';
import { BodyMeasurementDto } from '@/src/types/health';

import { MeasurementHistoryCard } from './MeasurementHistoryCard';

interface MeasurementComparePickerProps {
  /** Controlado externamente: el contenedor monta este componente solo cuando visible=true */
  excludeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * Contenido del bottom sheet para elegir el registro contra el cual comparar.
 * Este componente asume que ya está montado (el padre controla el render condicional).
 */
export function MeasurementComparePicker({
  excludeId,
  onSelect,
  onClose,
}: MeasurementComparePickerProps) {
  const { items, isLoading, isLoadingMore, hasMore, loadMore } = useMeasurementHistory();

  const filtered = items.filter((m: BodyMeasurementDto) => m.id !== excludeId);

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <Text className="text-slate-500 dark:text-slate-400 text-base text-center">
          No hay otros registros disponibles para comparar.
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
          Elegí un registro anterior para comparar métricas
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexGrow: 1 }}
        renderItem={({ item }) => (
          <MeasurementHistoryCard
            measurement={item}
            onPress={() => onSelect(item.id)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#e11d48" style={{ marginVertical: 8 }} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
}
