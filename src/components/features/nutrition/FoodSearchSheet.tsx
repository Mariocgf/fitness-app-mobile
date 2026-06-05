import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { useFoodBarcodeScanner } from '@/src/hooks/useFoodBarcodeScanner';
import { useFoodSearch } from '@/src/hooks/useFoodSearch';
import { FoodCatalogItemDto } from '@/src/types/nutrition';
import { formatMacro } from '@/src/utils/nutrition.utils';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, BarcodeType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FoodSearchSheetProps {
  visible: boolean;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (food: FoodCatalogItemDto, gramsConsumed: number) => Promise<boolean>;
}

const FOOD_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code39',
  'code93',
  'code128',
  'itf14',
  'codabar',
  'pdf417',
  'datamatrix',
  'aztec',
  'qr',
];

function MacroChip({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-full px-4 py-2">
      <Text className="text-slate-900 dark:text-slate-50 font-semibold">
        {label}. {formatMacro(value)}
      </Text>
    </View>
  );
}

function NutritionFact({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl py-4 items-center flex-1 min-w-[44%]">
      <Text className="text-slate-900 dark:text-slate-50 text-2xl font-semibold">
        {formatMacro(value)}
      </Text>
      <Text className="text-slate-900 dark:text-slate-300 text-base mt-1">{label}</Text>
    </View>
  );
}

/**
 * Bottom sheet para buscar, revisar detalle y agregar alimentos.
 */
export function FoodSearchSheet({
  visible,
  isAdding,
  onClose,
  onAdd,
}: FoodSearchSheetProps) {
  const {
    query,
    foods,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    setQuery,
    loadMore,
    reset,
  } = useFoodSearch();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const {
    isLookingUp,
    error: scannerError,
    scanBarcode,
    resetScanner,
  } = useFoodBarcodeScanner();
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItemDto | null>(null);
  const [gramsText, setGramsText] = useState('100');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const gramsConsumed = useMemo(() => {
    const parsed = Number(gramsText.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  }, [gramsText]);

  const handleClose = () => {
    setSelectedFood(null);
    setIsScannerOpen(false);
    setGramsText('100');
    resetScanner();
    reset();
    onClose();
  };

  const handleAdd = async () => {
    if (!selectedFood) return;
    const added = await onAdd(selectedFood, gramsConsumed);
    if (added) handleClose();
  };

  const handleOpenScanner = async () => {
    resetScanner();
    setIsScannerOpen(true);
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    const food = await scanBarcode(data);
    if (!food) return;

    setGramsText('100');
    setSelectedFood(food);
    setIsScannerOpen(false);
  };

  const handleCloseScanner = () => {
    resetScanner();
    setIsScannerOpen(false);
  };

  return (
    <BottomSheetModal visible={visible} onClose={handleClose}>
      {selectedFood ? (
        <View className="flex-1 px-6 pt-6">
          <TouchableOpacity
            onPress={() => setSelectedFood(null)}
            className="flex-row items-center mb-4"
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold flex-1 ml-2">
              {selectedFood.productName}
            </Text>
          </TouchableOpacity>

          {selectedFood.brand && (
            <Text className="text-slate-900 dark:text-slate-200 text-base mb-3">
              {selectedFood.brand}
            </Text>
          )}

          <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-900 dark:text-slate-50 text-base font-medium mr-3">{gramsText} g</Text>
              <View className="bg-black rounded-full px-4 py-2">
                <Text className="text-white font-bold">
                  {Math.round((selectedFood.energyKcal100g * gramsConsumed) / 100)} kcal
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-4 mt-6">
              <NutritionFact label="Proteína" value={(selectedFood.proteins100g * gramsConsumed) / 100} />
              <NutritionFact label="Carbohidratos" value={(selectedFood.carbohydrates100g * gramsConsumed) / 100} />
              <NutritionFact label="Grasa" value={(selectedFood.fat100g * gramsConsumed) / 100} />
              <NutritionFact label="Grasa sat." value={selectedFood.saturatedFat100g == null ? null : (selectedFood.saturatedFat100g * gramsConsumed) / 100} />
              <NutritionFact label="Fibra" value={selectedFood.fiber100g == null ? null : (selectedFood.fiber100g * gramsConsumed) / 100} />
              <NutritionFact label="Sal" value={selectedFood.salt100g == null ? null : (selectedFood.salt100g * gramsConsumed) / 100} />
            </View>
          </View>

          <View className="mt-auto pt-4">
            <TouchableOpacity
              disabled={isAdding}
              onPress={handleAdd}
              className="bg-slate-950 dark:bg-slate-50 rounded-full h-16 items-center justify-center"
            >
              {isAdding ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white dark:text-slate-950 font-semibold text-base">
                  Agregar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : isScannerOpen ? (
        <View className="flex-1 px-6 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={handleCloseScanner}
              className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
            >
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text className="text-slate-900 dark:text-slate-50 text-3xl font-bold flex-1">
              Escanear alimento
            </Text>
          </View>

          {cameraPermission?.granted ? (
            <View className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden">
              <CameraView
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODE_TYPES }}
                onBarcodeScanned={isLookingUp ? undefined : handleBarcodeScanned}
                style={{ flex: 1 }}
              >
                <View className="flex-1 items-center justify-center">
                  <View className="w-64 h-32 border-4 border-amber-400 rounded-3xl" />
                </View>
              </CameraView>
            </View>
          ) : (
            <View className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-6 items-center">
              <Ionicons name="camera-outline" size={48} color="#0f172a" />
              <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold text-center mt-4">
                Necesitamos permiso de cámara
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
                Sin cámara no podemos escanear el código de barras del alimento.
              </Text>
              <TouchableOpacity
                onPress={requestCameraPermission}
                className="bg-slate-950 dark:bg-slate-50 rounded-full px-6 py-4 mt-5"
              >
                <Text className="text-white dark:text-slate-950 font-semibold">
                  Dar permiso
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 mt-4">
            {isLookingUp ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fbbf24" />
                <Text className="text-slate-900 dark:text-slate-50 ml-3">
                  Buscando alimento...
                </Text>
              </View>
            ) : (
              <Text className="text-slate-500 dark:text-slate-400 text-center">
                Enfocá el código de barras dentro del recuadro.
              </Text>
            )}
          </View>

          {scannerError && (
            <Text className="text-red-500 text-sm mt-3">{scannerError}</Text>
          )}
        </View>
      ) : (
        <View className="flex-1 px-6 pt-6">
          <Text className="text-slate-900 dark:text-slate-50 text-4xl font-bold mb-6">
            Alimentos
          </Text>

          <View className="flex-row items-center mb-3">
            <View className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-2xl px-4 h-12 justify-center">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar alimento..."
                placeholderTextColor="#64748b"
                className="text-slate-900 dark:text-slate-50 text-base"
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              onPress={handleOpenScanner}
              className="w-12 h-12 items-center justify-center ml-3 bg-slate-200 dark:bg-slate-800 rounded-2xl"
            >
              <Ionicons name="scan-outline" size={30} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="text-red-500 text-sm mb-2">{error}</Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
            {isLoading ? (
              <ActivityIndicator color="#fbbf24" className="py-8" />
            ) : foods.length === 0 ? (
              <View className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 items-center">
                <Text className="text-slate-500 dark:text-slate-400 text-center">
                  Buscá un alimento para agregarlo.
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {foods.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    onPress={() => setSelectedFood(food)}
                    className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4"
                  >
                    <View className="flex-row items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-slate-900 dark:text-slate-50 font-semibold text-base">
                          {food.productName}
                        </Text>
                        {food.brand && (
                          <Text className="text-slate-900 dark:text-slate-300 mt-1">
                            {food.brand}
                          </Text>
                        )}
                        <View className="bg-black rounded-full px-4 py-2 mt-3 self-start">
                          <Text className="text-white font-bold">{Math.round(food.energyKcal100g)} kcal</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color="#0f172a" />
                    </View>

                    <View className="flex-row flex-wrap gap-3 mt-3">
                      <MacroChip label="Pro" value={food.proteins100g} />
                      <MacroChip label="Ch" value={food.carbohydrates100g} />
                      <MacroChip label="Gr" value={food.fat100g} />
                    </View>
                  </TouchableOpacity>
                ))}

                {hasNextPage && (
                  <TouchableOpacity
                    onPress={loadMore}
                    disabled={isLoadingMore}
                    className="bg-slate-100 dark:bg-slate-800 rounded-2xl py-8 items-center"
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator color="#fbbf24" />
                    ) : (
                      <Text className="text-slate-900 dark:text-slate-50 font-semibold">
                        Más alimentos
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </BottomSheetModal>
  );
}
