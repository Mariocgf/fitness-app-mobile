import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { IconTile } from '@/src/components/common/IconTile';
import { useFoodBarcodeScanner } from '@/src/hooks/useFoodBarcodeScanner';
import { useFoodSearch } from '@/src/hooks/useFoodSearch';
import { FoodCatalogItemDto } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FoodDetailPanel } from './FoodDetailPanel';
import { FoodScannerView } from './FoodScannerView';
import { MacroPills } from './MacroPills';

const AMBER = '#fbbf24';
const ZINC_400 = '#a1a1aa';

interface FoodSearchSheetProps {
  visible: boolean;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (food: FoodCatalogItemDto, gramsConsumed: number) => Promise<boolean>;
}

/** Gramos por defecto al agregar un alimento (se ajustan luego en la card). */
const DEFAULT_GRAMS = 100;

/**
 * Bottom sheet para buscar alimentos del catálogo (dark `zinc`/`amber`).
 * Rediseñado desde la maqueta "Alimentos": lista de resultados con selección
 * única + CTA "Agregar seleccionado". Cada item tiene un botón de info que abre
 * el detalle completo (`FoodDetailPanel`), desde donde también se puede agregar.
 * El botón de escaneo abre el lector de código de barras (`FoodScannerView`).
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
        <FoodDetailPanel
          food={detailFood}
          grams={detailGrams}
          onGramsChange={setDetailGrams}
          isAdding={isAdding}
          onAdd={handleAddFromDetail}
          onBack={() => setDetailFood(null)}
        />
      ) : isScannerOpen ? (
        <FoodScannerView
          cameraGranted={!!cameraPermission?.granted}
          onRequestPermission={requestCameraPermission}
          onScanned={handleBarcodeScanned}
          isLookingUp={isLookingUp}
          scannerError={scannerError}
          onClose={handleCloseScanner}
        />
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
