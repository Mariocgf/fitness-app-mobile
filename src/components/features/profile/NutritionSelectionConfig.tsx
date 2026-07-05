import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import SearchableSelect from '@/src/components/common/SearchableSelect';
import { toast } from '@/src/components/ui/feedback';
import { useUnsavedChangesGuard } from '@/src/hooks/useUnsavedChangesGuard';
import { UserNutritionItem } from '@/src/services/profile.service';
import { NutritionItem } from '@/src/types/nutrition';

interface NutritionSelectionConfigProps {
  /** Carga el catálogo completo de opciones seleccionables */
  fetchCatalog: (token: string | null) => Promise<NutritionItem[]>;
  /** Carga los ítems actualmente seleccionados por el usuario */
  fetchSelected: (token: string | null) => Promise<UserNutritionItem[]>;
  /** Persiste la nueva selección del usuario */
  save: (ids: string[], token: string | null) => Promise<unknown>;
  /** Título de la card (mismo look que el onboarding, ej. "¿Tienes alguna alergia?") */
  cardTitle: string;
  /** Placeholder del buscador (ej. "Buscar alergia") */
  searchPlaceholder: string;
  /** Mensaje de éxito tras guardar */
  successMessage: string;
  /** Mensaje del guard de cambios sin guardar */
  guardMessage: string;
  /** Vuelve a la lista del módulo tras guardar (la ruta lo cablea a `router.back()`) */
  onBack: () => void;
}

/**
 * Config genérica de una selección de nutrición (Alergias / Estilo de dieta) dentro
 * del Perfil. Reutiliza el `SearchableSelect` del onboarding (buscar + card con
 * `cardTitle`), pero conserva el marco de Perfil: botón Guardar y guard de cambios.
 *
 * Cada selección vive en su propia ruta (`/profile/nutrition-*`), pasando su catálogo,
 * getter/updater y textos. Dark-only `zinc`.
 */
export default function NutritionSelectionConfig({
  fetchCatalog,
  fetchSelected,
  save,
  cardTitle,
  searchPlaceholder,
  successMessage,
  guardMessage,
  onBack,
}: NutritionSelectionConfigProps) {
  const { getToken } = useAuth();

  const [catalog, setCatalog] = useState<NutritionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();

        const [cat, selected] = await Promise.all([
          fetchCatalog(token),
          fetchSelected(token),
        ]);

        setCatalog(Array.isArray(cat) ? cat : []);

        const ids = (Array.isArray(selected) ? selected : []).map(
          (item: UserNutritionItem) => item.id
        );
        setSelectedIds(ids);
        setInitialIds(ids);
      } catch (e) {
        logger.error('Error cargando datos de nutrición:', e);
        toast.error('No se pudieron cargar los datos de nutrición.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  /** Detecta cambios reales comparando arrays de IDs (ignora orden) */
  const hasChanges =
    selectedIds.length !== initialIds.length ||
    selectedIds.some((id) => !initialIds.includes(id));

  useUnsavedChangesGuard(hasChanges, guardMessage);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await save(selectedIds, token);
      setInitialIds([...selectedIds]);
      toast.success(successMessage);
      onBack();
    } catch (error) {
      logger.error('Error guardando selección de nutrición:', error);
      toast.error('No se pudieron actualizar los datos.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#f4f4f5" />
        <Text className="text-zinc-400 mt-4">Cargando datos de nutrición...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-zinc-950">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
        >
          <SearchableSelect
            items={catalog}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            placeholder={searchPlaceholder}
            cardTitle={cardTitle}
          />
        </Pressable>
      </ScrollView>

      {/* Botón Guardar */}
      <View className="px-6 pb-32 pt-4">
        <TouchableOpacity
          style={isSaving ? { opacity: 0.7 } : undefined}
          className="bg-zinc-50 w-full py-4 rounded-full items-center"
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Text className="text-zinc-950 text-base font-semibold">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
