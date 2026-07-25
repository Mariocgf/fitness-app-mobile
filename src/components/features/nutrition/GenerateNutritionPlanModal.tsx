import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  DeviceEventEmitter,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddInlineButton from '@/src/components/common/AddInlineButton';
import InfoChips from '@/src/components/common/InfoChips';
import SearchableSelect from '@/src/components/common/SearchableSelect';
import SectionCard from '@/src/components/common/SectionCard';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { useNutritionInlineEditor } from '@/src/hooks/useNutritionInlineEditor';
import { NutritionGenerationDraft } from '@/src/types/nutritionRoutine';

interface GenerateNutritionPlanModalProps {
  /** Cierra el modal sin generar. */
  onClose: () => void;
  /**
   * Entrega la selección actual + la función que persiste alergias/dietas. El padre
   * cierra el modal y corre `persist()` ANTES de generar, porque el backend lee esos
   * datos del perfil (el POST de generación no lleva body). Por eso NO se genera acá.
   * La selección viaja para poder reabrir el modal tal cual si algo falla.
   */
  onSubmit: (draft: NutritionGenerationDraft, persist: () => Promise<void>) => void;
  /**
   * Estado conservado de un intento fallido: reabre el modal tal cual estaba y sin
   * volver a pedir `generation-options`. Si es null, se carga desde el backend.
   */
  initialDraft?: NutritionGenerationDraft | null;
}

/**
 * Overlay full-screen (dark-only `zinc` + acento `amber-400`) para generar el plan de
 * nutrición con IA. Permite revisar y editar alergias y tipos de dieta antes de generar,
 * y muestra los objetivos calóricos vigentes como información de solo lectura.
 *
 * Usa un `View` absoluto (no un `Modal` nativo de RN, mismo patrón que
 * `GenerateRoutineModal`): así una pantalla a la que se navegue queda ENCIMA.
 * El CTA se padea sobre el tab bar nativo (`TAB_BAR_HEIGHT`), que no queda cubierto.
 */
export function GenerateNutritionPlanModal({
  onClose,
  onSubmit,
  initialDraft,
}: GenerateNutritionPlanModalProps) {
  const insets = useSafeAreaInsets();

  /* ── Back de Android cierra el overlay (no hay Modal nativo que lo capture) ─ */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  /* ── PWA: el teclado no dispara KeyboardAvoidingView (RNW), así que medimos
     cuánto tapa vía visualViewport y lo sumamos al padding inferior del scroll. ─ */
  const [webKeyboardInset, setWebKeyboardInset] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setWebKeyboardInset(inset);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  const nutrition = useNutritionInlineEditor(initialDraft);

  /** Las cards arrancan colapsadas (solo lectura) hasta tocar "Agregar". */
  const [showAllergyEditor, setShowAllergyEditor] = useState(false);
  const [showDietEditor, setShowDietEditor] = useState(false);

  /** Nombres de lo seleccionado, para los chips de la vista colapsada. */
  const selectedAllergyNames = nutrition.allergies
    .filter((item) => nutrition.allergyIds.includes(item.id))
    .map((item) => item.name);
  const selectedDietNames = nutrition.diets
    .filter((item) => nutrition.dietIds.includes(item.id))
    .map((item) => item.name);

  const targetChips = nutrition.targets
    ? [
        `${Math.round(nutrition.targets.calories)} kcal`,
        `${Math.round(nutrition.targets.proteinGrams)} g proteína`,
        `${Math.round(nutrition.targets.carbsGrams)} g carbos`,
        `${Math.round(nutrition.targets.fatGrams)} g grasas`,
      ]
    : [];

  const handleGenerate = () => {
    if (!nutrition.options) return; // aún cargando: el CTA no debería estar activo

    // Hand-off al padre: cierra el modal y corre persist() + generación. `persist`
    // no hace setState, así que es seguro invocarlo después de que este modal se desmonte.
    // Va el snapshot completo (no solo los ids) para que, si falla, el padre pueda
    // reabrir el modal sin repetir la llamada a `generation-options`.
    onSubmit(
      {
        options: nutrition.options,
        allergyIds: nutrition.allergyIds,
        dietIds: nutrition.dietIds,
      },
      nutrition.persist,
    );
  };

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
      className="bg-zinc-950"
    >
      <View className="flex-1 bg-zinc-950">
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 pb-4"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-1">
            <Text className="text-amber-400 text-xs font-semibold uppercase tracking-widest">
              Generar con IA
            </Text>
            <Text className="text-2xl font-bold text-white mt-0.5">Nuevo plan</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {nutrition.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fbbf24" />
          </View>
        ) : nutrition.error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="cloud-offline-outline" size={40} color="#52525b" />
            <Text className="text-zinc-400 text-center mt-3 mb-4">{nutrition.error}</Text>
            <TouchableOpacity
              onPress={nutrition.refresh}
              className="px-6 py-3 rounded-full bg-zinc-800"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              onScrollBeginDrag={() => DeviceEventEmitter.emit('closeDropdowns')}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24 + webKeyboardInset,
                gap: 16,
              }}
            >
              {/* Fondo tocable para cerrar los dropdowns al tocar afuera. Va DENTRO
                  del scroll (como hijo absoluto detrás de las cards) para NO bloquear
                  el gesto de scroll: solo reacciona al tap simple, el arrastre lo
                  maneja el ScrollView. */}
              <Pressable
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={() => DeviceEventEmitter.emit('closeDropdowns')}
              />

              {/* Objetivos: solo lectura, los calcula el backend desde el perfil */}
              {targetChips.length > 0 && (
                <SectionCard
                  icon={<Ionicons name="flame-outline" size={20} color="#a1a1aa" />}
                  title="Tus objetivos"
                  subtitle="El plan va a apuntar a estos valores"
                >
                  <InfoChips items={targetChips} />
                </SectionCard>
              )}

              {/* Alergias: colapsada (solo lectura) hasta tocar "Agregar" */}
              {showAllergyEditor ? (
                <SearchableSelect
                  items={nutrition.allergies}
                  selectedIds={nutrition.allergyIds}
                  onSelectionChange={nutrition.setAllergyIds}
                  placeholder="Buscar alergia"
                  cardTitle="Alergias"
                  cardSubtitle="El plan las va a evitar"
                  cardIconName="alert-circle-outline"
                />
              ) : (
                <SectionCard
                  icon={<Ionicons name="alert-circle-outline" size={20} color="#a1a1aa" />}
                  title="Alergias"
                  subtitle="El plan las va a evitar"
                >
                  {selectedAllergyNames.length > 0 ? (
                    <InfoChips items={selectedAllergyNames} />
                  ) : (
                    <Text className="text-zinc-400 text-sm mb-3">
                      No tenés alergias registradas.
                    </Text>
                  )}
                  <AddInlineButton
                    accent="amber"
                    label={
                      selectedAllergyNames.length > 0 ? 'Agregar o quitar' : 'Agregar alergia'
                    }
                    onPress={() => setShowAllergyEditor(true)}
                  />
                </SectionCard>
              )}

              {/* Tipos de dieta: colapsada hasta tocar "Agregar" */}
              {showDietEditor ? (
                <SearchableSelect
                  items={nutrition.diets}
                  selectedIds={nutrition.dietIds}
                  onSelectionChange={nutrition.setDietIds}
                  placeholder="Buscar tipo de dieta"
                  cardTitle="Tipo de dieta"
                  cardSubtitle="La IA va a respetar tus preferencias"
                  cardIconName="leaf-outline"
                />
              ) : (
                <SectionCard
                  icon={<Ionicons name="leaf-outline" size={20} color="#a1a1aa" />}
                  title="Tipo de dieta"
                  subtitle="La IA va a respetar tus preferencias"
                >
                  {selectedDietNames.length > 0 ? (
                    <InfoChips items={selectedDietNames} />
                  ) : (
                    <Text className="text-zinc-400 text-sm mb-3">
                      No elegiste ningún tipo de dieta.
                    </Text>
                  )}
                  <AddInlineButton
                    accent="amber"
                    label={selectedDietNames.length > 0 ? 'Agregar o quitar' : 'Elegir dieta'}
                    onPress={() => setShowDietEditor(true)}
                  />
                </SectionCard>
              )}
            </ScrollView>

            {/* CTA fijo — padeado sobre el tab bar nativo (queda por encima) */}
            <View
              style={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
              className="px-4 pt-3 bg-zinc-950 border-t border-zinc-900"
            >
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={!nutrition.options}
                activeOpacity={0.85}
                style={{ backgroundColor: '#fbbf24', opacity: nutrition.options ? 1 : 0.5 }}
                className="flex-row items-center justify-center gap-2 py-4 rounded-full"
              >
                <Ionicons name="sparkles" size={18} color="#18181b" />
                <Text className="text-zinc-900 font-bold text-base">Generar plan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
