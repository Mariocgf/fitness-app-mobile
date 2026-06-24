import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, BarcodeType, CameraView } from 'expo-camera';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const AMBER = '#fbbf24';

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

interface FoodScannerViewProps {
  cameraGranted: boolean;
  onRequestPermission: () => void;
  onScanned: (result: BarcodeScanningResult) => void;
  isLookingUp: boolean;
  scannerError: string | null;
  onClose: () => void;
}

/**
 * Vista de escaneo de código de barras del `FoodSearchSheet`: pide permiso de
 * cámara si falta, muestra el visor con el recuadro guía y el estado de búsqueda
 * del alimento. Mientras se busca un código (`isLookingUp`) ignora nuevos escaneos.
 */
export function FoodScannerView({
  cameraGranted,
  onRequestPermission,
  onScanned,
  isLookingUp,
  scannerError,
  onClose,
}: FoodScannerViewProps) {
  return (
    <View className="flex-1 px-5 pt-6">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          onPress={onClose}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mr-3"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold flex-1">
          Escanear alimento
        </Text>
      </View>

      {cameraGranted ? (
        <View className="h-96 bg-zinc-900 rounded-3xl overflow-hidden">
          <CameraView
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODE_TYPES }}
            onBarcodeScanned={isLookingUp ? undefined : onScanned}
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
            onPress={onRequestPermission}
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
  );
}
