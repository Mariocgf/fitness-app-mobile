import { MeasurementHistoryCard } from '@/src/components/features/health/MeasurementHistoryCard';
import { useMeasurementHistory } from '@/src/hooks/useMeasurementHistory';
import { BodyMeasurementDto } from '@/src/types/health';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeasurementHistoryScreen() {
  const router = useRouter();
  const {
    items,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useMeasurementHistory();

  const handlePressItem = useCallback(
    (measurement: BodyMeasurementDto) => {
      router.push({
        pathname: '/health/[id]' as any,
        params: { id: measurement.id, data: JSON.stringify(measurement) },
      });
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4 gap-1">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-1 -ml-1"
        >
          <Ionicons
            name="chevron-back"
            size={28}
            className="text-slate-900 dark:text-slate-50"
          />
        </TouchableOpacity>
        <Text className="flex-1 text-slate-900 dark:text-slate-50 text-xl font-bold">
          Historial
        </Text>
        {totalCount > 0 && (
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {totalCount} registro{totalCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
          <Text className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
            Cargando historial...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            paddingTop: 4,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <MeasurementHistoryCard
              measurement={item}
              onPress={() => handlePressItem(item)}
            />
          )}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          onRefresh={refresh}
          refreshing={isLoading}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#e11d48" />
              </View>
            ) : error ? (
              <TouchableOpacity
                onPress={loadMore}
                activeOpacity={0.8}
                className="py-4 items-center"
              >
                <Text className="text-rose-600 dark:text-rose-400 text-sm text-center">
                  {error}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 gap-3">
              <Ionicons
                name="body-outline"
                size={44}
                className="text-slate-400 dark:text-slate-500"
              />
              <Text className="text-slate-500 dark:text-slate-400 text-center">
                No hay mediciones registradas todavía.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
