import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { IconTile } from '@/src/components/common/IconTile';
import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { useFoodBarcodeScanner } from '@/src/hooks/useFoodBarcodeScanner';
import { useFoodSearch } from '@/src/hooks/useFoodSearch';
import { FoodCatalogItemDto } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, BarcodeType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MacroPills } from './MacroPills';

const AMBER = '#fbbf24';
const ZINC_400 = '#a1a1aa';

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

/** Gramos por defecto al agregar un alimento (se ajustan luego en la card). */
const DEFAULT_GRAMS = 100;

/**
 * Tile de dato nutricional del detalle: valor grande + unidad `g` y label debajo.
 * Ocupa media columna (`w-[48%]`) para armar el grid 2×3 de la maqueta.
 */
function NutritionFact({ label, value }: { label: string; value: number | null }) {
  const rounded = value == null ? null : Math.round(value * 10) / 10;
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-2xl py-5 px-4 items-center w-[48%]">
      <View className="flex-row items-baseline">
        <Text className="text-white text-3xl font-bold">{rounded ?? '—'}</Text>
        {rounded != null && (
          <Text className="text-zinc-400 text-base font-medium ml-1">g</Text>
        )}
      </View>
      <Text className="text-zinc-400 text-sm mt-1">{label}</Text>
    </View>
  );
}

/**
 * Bottom sheet para buscar alimentos del catálogo (dark `zinc`/`amber`).
 * Rediseñado desde la maqueta "Alimentos": lista de resultados con selección
 * única + CTA "Agregar seleccionado". Cada item tiene un botón de info que abre
 * el detalle completo, desde donde también se puede agregar.
 *
 * No se renderiza "Recientes" de la maqueta: no existe endpoint de alimentos
 * recientes en el backend (ver `agent-implementation-lessons.md`).
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
  /** Item marcado para el CTA "Agregar seleccionado". */
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  /** Item abierto en el detalle (botón info). */
  const [detailFood, setDetailFood] = useState<FoodCatalogItemDto | null>(null);
  const [detailGrams, setDetailGrams] = useState(DEFAULT_GRAMS);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleClose = () => {
    setSelectedFoodId(null);
    setDetailFood(null);
    setDetailGrams(DEFAULT_GRAMS);
    setIsScannerOpen(false);
    resetScanner();
    reset();
    onClose();
  };

  const toggleSelect = (foodId: string) => {
    setSelectedFoodId((prev) => (prev === foodId ? null : foodId));
  };

  const openDetail = (food: FoodCatalogItemDto) => {
    setDetailGrams(DEFAULT_GRAMS);
    setDetailFood(food);
  };

  /** Agrega el item marcado desde el CTA inferior (gramos por defecto). */
  const handleAddSelected = async () => {
    const food = foods.find((item) => item.id === selectedFoodId);
    if (!food) return;
    const added = await onAdd(food, DEFAULT_GRAMS);
    if (added) handleClose();
  };

  /** Agrega desde el detalle con los gramos elegidos. */
  const handleAddFromDetail = async () => {
    if (!detailFood) return;
    const added = await onAdd(detailFood, detailGrams);
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

    setDetailGrams(DEFAULT_GRAMS);
    setDetailFood(food);
    setIsScannerOpen(false);
  };

  const handleCloseScanner = () => {
    resetScanner();
    setIsScannerOpen(false);
  };

  return (
    <BottomSheetModal visible={visible} onClose={handleClose}>
      {detailFood ? (
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pt-4 pb-4"
          >
            {/* Header: back circular + título y marca centrados */}
            <TouchableOpacity
              onPress={() => setDetailFood(null)}
              className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View className="items-center px-4 mt-1 mb-6">
              <Text className="text-white text-3xl font-bold text-center">
                {detailFood.productName}
              </Text>
              {detailFood.brand && (
                <Text className="text-zinc-400 text-base mt-1 text-center" numberOfLines={1}>
                  {detailFood.brand}
                </Text>
              )}
            </View>

            {/* Cantidad: stepper actual + badge de kcal (acento amber) */}
            <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-zinc-400 text-base">Cantidad</Text>
                <View className="border border-amber-400 rounded-xl px-3 py-1.5">
                  <Text className="text-amber-400 font-bold">
                    {Math.round((detailFood.energyKcal100g * detailGrams) / 100)} kcal
                  </Text>
                </View>
              </View>
              <QuantityStepper
                value={detailGrams}
                onChange={setDetailGrams}
                min={1}
                max={2000}
                step={5}
              />
            </View>

            {/* Información nutricional: grid 2×3 */}
            <Text className="text-white text-lg font-bold mt-6 mb-3">
              Información nutricional
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <NutritionFact label="Proteína" value={(detailFood.proteins100g * detailGrams) / 100} />
              <NutritionFact label="Carbohidratos" value={(detailFood.carbohydrates100g * detailGrams) / 100} />
              <NutritionFact label="Grasas" value={(detailFood.fat100g * detailGrams) / 100} />
              <NutritionFact label="Grasas sat." value={detailFood.saturatedFat100g == null ? null : (detailFood.saturatedFat100g * detailGrams) / 100} />
              <NutritionFact label="Fibra" value={detailFood.fiber100g == null ? null : (detailFood.fiber100g * detailGrams) / 100} />
              <NutritionFact label="Sal" value={detailFood.salt100g == null ? null : (detailFood.salt100g * detailGrams) / 100} />
            </View>
          </ScrollView>

          <View className="px-5 pt-3">
            <TouchableOpacity
              disabled={isAdding}
              onPress={handleAddFromDetail}
              activeOpacity={0.85}
              className="bg-amber-400 rounded-full py-4 flex-row items-center justify-center"
            >
              {isAdding ? (
                <ActivityIndicator color="#18181b" />
              ) : (
                <>
                  <Ionicons name="restaurant" size={20} color="#18181b" />
                  <Text className="text-zinc-900 font-bold text-base ml-2">
                    Agregar alimento
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : isScannerOpen ? (
        <View className="flex-1 px-5 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={handleCloseScanner}
              className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mr-3"
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1">
              Escanear alimento
            </Text>
          </View>

          {cameraPermission?.granted ? (
            <View className="h-96 bg-zinc-900 rounded-3xl overflow-hidden">
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
            <View className="bg-zinc-900 rounded-3xl p-6 items-center">
              <Ionicons name="camera-outline" size={48} color={AMBER} />
              <Text className="text-white text-xl font-bold text-center mt-4">
                Necesitamos permiso de cámara
              </Text>
              <Text className="text-zinc-400 text-center mt-2">
                Sin cámara no podemos escanear el código de barras del alimento.
              </Text>
              <TouchableOpacity
                onPress={requestCameraPermission}
                className="bg-amber-400 rounded-full px-6 py-4 mt-5"
              >
                <Text className="text-zinc-900 font-bold">Dar permiso</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="bg-zinc-900 rounded-2xl p-4 mt-4">
            {isLookingUp ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color={AMBER} />
                <Text className="text-white ml-3">Buscando alimento...</Text>
              </View>
            ) : (
              <Text className="text-zinc-400 text-center">
                Enfocá el código de barras dentro del recuadro.
              </Text>
            )}
          </View>

          {scannerError && (
            <Text className="text-rose-400 text-sm mt-3">{scannerError}</Text>
          )}
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-5 pt-6">
            <Text className="text-white text-3xl font-bold mb-5">Alimentos</Text>

            <View className="flex-row items-center">
              <View className="flex-1 flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 h-14">
                <Ionicons name="search" size={20} color={ZINC_400} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar alimentos..."
                  placeholderTextColor={ZINC_400}
                  className="flex-1 text-white text-base ml-2"
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                onPress={handleOpenScanner}
                className="w-14 h-14 items-center justify-center ml-3 bg-zinc-900 border border-zinc-800 rounded-2xl"
              >
                <Ionicons name="scan-outline" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {error && <Text className="text-rose-400 text-sm mt-3">{error}</Text>}

            <Text className="text-white text-lg font-bold mt-6">Resultados</Text>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pt-3 pb-4 gap-3"
          >
            {isLoading ? (
              <ActivityIndicator color={AMBER} className="py-8" />
            ) : foods.length === 0 ? (
              <View className="bg-zinc-900 rounded-2xl p-8 items-center">
                <Text className="text-zinc-400 text-center">
                  Buscá un alimento para agregarlo.
                </Text>
              </View>
            ) : (
              <>
                {foods.map((food) => {
                  const isSelected = selectedFoodId === food.id;
                  return (
                    <TouchableOpacity
                      key={food.id}
                      onPress={() => toggleSelect(food.id)}
                      activeOpacity={0.85}
                      className={`bg-zinc-900 rounded-2xl p-4 border ${
                        isSelected ? 'border-amber-400' : 'border-zinc-800'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <IconTile name="nutrition-outline" size={44} />
                        <View className="flex-1 px-3">
                          <Text
                            className="text-white font-semibold text-base"
                            numberOfLines={1}
                          >
                            {food.productName}
                          </Text>
                          {food.brand && (
                            <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                              {food.brand}
                            </Text>
                          )}
                        </View>
                        <View className="bg-zinc-800 rounded-lg px-3 py-1.5 mr-2">
                          <Text className="text-white font-semibold text-sm">
                            {Math.round(food.energyKcal100g)}
                            <Text className="text-zinc-400 text-xs"> kcal</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openDetail(food)}
                          hitSlop={8}
                          className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center"
                        >
                          <Ionicons name="information-circle-outline" size={22} color={AMBER} />
                        </TouchableOpacity>
                      </View>

                      <View className="mt-3">
                        <MacroPills
                          compact
                          protein={food.proteins100g}
                          carbs={food.carbohydrates100g}
                          fat={food.fat100g}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {hasNextPage && (
                  <TouchableOpacity
                    onPress={loadMore}
                    disabled={isLoadingMore}
                    className="bg-zinc-900 border border-dashed border-amber-400/50 rounded-2xl py-5 flex-row items-center justify-center"
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator color={AMBER} />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={22} color={AMBER} />
                        <Text className="text-amber-400 font-semibold ml-2">
                          Ver más alimentos
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>

          <View className="px-5 pt-3">
            <TouchableOpacity
              disabled={!selectedFoodId || isAdding}
              onPress={handleAddSelected}
              activeOpacity={0.85}
              style={{ opacity: selectedFoodId ? 1 : 0.5 }}
              className="bg-amber-400 rounded-full py-4 flex-row items-center justify-center"
            >
              {isAdding ? (
                <ActivityIndicator color="#18181b" />
              ) : (
                <>
                  <Ionicons name="restaurant" size={20} color="#18181b" />
                  <Text className="text-zinc-900 font-bold text-base ml-2">
                    Agregar seleccionado
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BottomSheetModal>
  );
}
