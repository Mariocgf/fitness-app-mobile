import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import SearchableSelect from '@/src/components/common/SearchableSelect';
import SectionCard from '@/src/components/common/SectionCard';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import WeekDayPicker from '@/src/components/common/WeekDayPicker';
import WheelPicker from '@/src/components/common/WheelPicker';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { toast } from '@/src/components/ui/feedback';
import { useGenerateRoutineModal } from '@/src/hooks/useGenerateRoutineModal';
import { useHealthInlineEditor } from '@/src/hooks/useHealthInlineEditor';
import { WEEKDAY_OPTIONS } from '@/src/types/fitness';
import { GenerateRoutinePayload } from '@/src/types/routine';
import { toFitnessDays, toPickerDays } from '@/src/utils/weekday';

interface GenerateRoutineModalProps {
  /** Cierra el modal sin generar. */
  onClose: () => void;
  /**
   * Entrega el payload validado + la función que persiste lesiones/condiciones.
   * El padre cierra el modal y muestra la card en estado "generando" mientras
   * corre `persist()` + la generación; por eso NO se genera acá adentro.
   */
  onSubmit: (payload: GenerateRoutinePayload, persist: () => Promise<void>) => void;
  /**
   * Pre-carga los campos con estos valores (ej: tras un fallo de generación, para
   * no re-seleccionar todo). Si es null, se siembra desde `generation-options`.
   */
  initialDraft?: GenerateRoutinePayload | null;
}

/** Etiquetas en español para los valores crudos del backend. Fallback = el valor. */
const LOCATION_LABELS: Record<string, string> = {
  Gym: 'Gimnasio',
  Home: 'Casa',
  Calisthenics: 'Calistenia',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Beginner: 'Principiante',
  Intermediate: 'Intermedio',
  Advanced: 'Avanzado',
};

const DEFAULT_SESSION_MINUTES = 60;

/** Chips informativos de solo lectura (equipamiento, lesiones, afecciones). */
function InfoChips({ items }: { items: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-3">
      {items.map((label) => (
        <View key={label} className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
          <Text className="text-zinc-200 text-sm">{label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Botón "Agregar" con acento lime (abre el editor inline o navega). */
function AddInlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center justify-center py-3 rounded-2xl border border-lime-400 bg-lime-400/10"
    >
      <Ionicons name="add" size={18} color="#a3e635" />
      <Text className="text-lime-400 font-semibold text-sm ml-1.5">{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * Overlay full-screen (dark-only `zinc` + acento `lime-400`) para generar una rutina
 * con IA. Pide lugar, nivel, tiempo y días; en "Casa" ofrece cargar equipamiento
 * (navegando) y permite registrar lesiones/condiciones inline antes de generar.
 * Se monta solo cuando el padre lo renderiza (condicional a `visible === true`).
 *
 * Usa un `View` absoluto (no un `Modal` nativo de RN, mismo patrón que
 * `RoutineDetailView`): así al navegar a la vista de equipamiento esa pantalla
 * queda ENCIMA — un `Modal` nativo flotaría sobre la navegación y la taparía.
 * El CTA se padea sobre el tab bar nativo (`TAB_BAR_HEIGHT`), que no queda cubierto.
 */
export function GenerateRoutineModal({ onClose, onSubmit, initialDraft }: GenerateRoutineModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  const { options, isLoading, error, refresh } = useGenerateRoutineModal();
  const health = useHealthInlineEditor();

  /* ── Selecciones del usuario ──────────────────────────────────────────── */
  const [workoutLocation, setWorkoutLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [hasFlexibleTime, setHasFlexibleTime] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULT_SESSION_MINUTES);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  /** Las cards de salud arrancan colapsadas (solo lectura) hasta tocar "Agregar". */
  const [showInjuryEditor, setShowInjuryEditor] = useState(false);
  const [showConditionEditor, setShowConditionEditor] = useState(false);

  /* ── Pre-carga una sola vez: desde el draft (si viene tras un fallo) o desde
     las opciones del backend. ─────────────────────────────────────────────── */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialDraft) {
      setWorkoutLocation(initialDraft.workoutLocation);
      setExperienceLevel(initialDraft.experienceLevel);
      setHasFlexibleTime(initialDraft.sessionDurationMinutes == null);
      setSessionMinutes(initialDraft.sessionDurationMinutes ?? DEFAULT_SESSION_MINUTES);
      setSelectedDays(toPickerDays(initialDraft.preferredWorkoutDays));
      initializedRef.current = true;
      return;
    }
    if (!options) return;
    setHasFlexibleTime(options.sessionDurationMinutes == null);
    setSessionMinutes(options.sessionDurationMinutes ?? DEFAULT_SESSION_MINUTES);
    setSelectedDays(toPickerDays(options.preferredWorkoutDays));
    initializedRef.current = true;
  }, [options, initialDraft]);

  /* ── Al volver de la vista de equipamiento, refrescar el resumen ───────── */
  const skipFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocusRef.current) {
        skipFirstFocusRef.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );

  const isHome = workoutLocation === 'Home';

  const canGenerate =
    !!workoutLocation && !!experienceLevel && selectedDays.length > 0;

  const handleGenerate = () => {
    if (!workoutLocation) {
      toast.warning('Elegí dónde vas a entrenar.', { title: 'Falta información' });
      return;
    }
    if (!experienceLevel) {
      toast.warning('Elegí tu nivel.', { title: 'Falta información' });
      return;
    }
    const days = toFitnessDays(selectedDays);
    if (days.length === 0) {
      toast.warning('Seleccioná al menos un día para entrenar.', { title: 'Falta información' });
      return;
    }
    const minutes = hasFlexibleTime ? null : sessionMinutes;
    if (minutes != null && (minutes <= 0 || minutes > 300)) {
      toast.warning('La duración debe estar entre 1 y 300 minutos.', { title: 'Falta información' });
      return;
    }

    // Hand-off al padre: cierra el modal y muestra la card "generando" mientras
    // corre persist() + generación. `health.persist` no hace setState, así que es
    // seguro invocarlo después de que este modal se desmonte.
    onSubmit(
      {
        workoutLocation,
        experienceLevel,
        sessionDurationMinutes: minutes,
        preferredWorkoutDays: days,
      },
      health.persist,
    );
  };

  const locationOptions = (options?.workoutLocationOptions ?? []).map((value) => ({
    value,
    label: LOCATION_LABELS[value] ?? value,
  }));
  const difficultyOptions = (options?.difficultyOptions ?? []).map((value) => ({
    value,
    label: DIFFICULTY_LABELS[value] ?? value,
  }));

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
              <Text className="text-lime-400 text-xs font-semibold uppercase tracking-widest">
                Generar con IA
              </Text>
              <Text className="text-2xl font-bold text-white mt-0.5">Nueva rutina</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#a3e635" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="cloud-offline-outline" size={40} color="#52525b" />
              <Text className="text-zinc-400 text-center mt-3 mb-4">{error}</Text>
              <TouchableOpacity
                onPress={refresh}
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

                {/* Lugar */}
                <SectionCard
                  icon={<Ionicons name="location-outline" size={20} color="#a1a1aa" />}
                  title="Lugar"
                  subtitle="¿Dónde vas a entrenar?"
                >
                  <SegmentedControl
                    options={locationOptions}
                    value={workoutLocation}
                    onChange={setWorkoutLocation}
                    accent="lime"
                    variant="solid"
                  />
                </SectionCard>

                {/* Equipamiento (solo Casa) */}
                {isHome && (
                  <SectionCard
                    icon={<Ionicons name="barbell-outline" size={20} color="#a1a1aa" />}
                    title="Equipamiento"
                    subtitle="La IA usa lo que tengas cargado"
                  >
                    {options && options.equipment.length > 0 ? (
                      <InfoChips items={options.equipment} />
                    ) : (
                      <Text className="text-zinc-400 text-sm mb-3">
                        Todavía no cargaste equipamiento. Sin equipamiento se usa peso corporal.
                      </Text>
                    )}
                    <AddInlineButton
                      label={
                        options && options.equipment.length > 0
                          ? 'Agregar más equipamiento'
                          : 'Agregar equipamiento'
                      }
                      onPress={() => router.push('/profile/fitness-equipment')}
                    />
                  </SectionCard>
                )}

                {/* Nivel */}
                <SectionCard
                  icon={<Ionicons name="stats-chart-outline" size={20} color="#a1a1aa" />}
                  title="Nivel"
                  subtitle="¿Qué tan avanzado estás?"
                >
                  <SegmentedControl
                    options={difficultyOptions}
                    value={experienceLevel}
                    onChange={setExperienceLevel}
                    accent="lime"
                    variant="solid"
                  />
                </SectionCard>

                {/* Tiempo */}
                <SectionCard
                  icon={<Ionicons name="time-outline" size={20} color="#a1a1aa" />}
                  title="Duración"
                  subtitle="¿Cuánto tiempo tenés por sesión?"
                >
                  <SegmentedControl
                    options={[
                      { value: 'flex', label: 'Tengo tiempo' },
                      { value: 'fixed', label: 'Elegir tiempo' },
                    ]}
                    value={hasFlexibleTime ? 'flex' : 'fixed'}
                    onChange={(v) => setHasFlexibleTime(v === 'flex')}
                    accent="lime"
                  />
                  {hasFlexibleTime ? (
                    <Text className="text-zinc-400 text-sm text-center mt-4">
                      Sin límite de tiempo por sesión.
                    </Text>
                  ) : (
                    <View className="mt-3">
                      <WheelPicker
                        label="Tiempo por sesión"
                        value={sessionMinutes}
                        onChange={setSessionMinutes}
                        min={15}
                        max={120}
                        step={5}
                        unit="min"
                        accent="lime"
                        wheelHeight={150}
                      />
                    </View>
                  )}
                </SectionCard>

                {/* Días */}
                <SectionCard
                  icon={<Ionicons name="calendar-outline" size={20} color="#a1a1aa" />}
                  title="Días"
                  subtitle="¿Qué días vas a entrenar?"
                >
                  <WeekDayPicker
                    days={WEEKDAY_OPTIONS}
                    selectedDays={selectedDays}
                    onChange={setSelectedDays}
                    accent="lime"
                  />
                </SectionCard>

                {/* Lesiones: colapsada (solo lectura) hasta tocar "Agregar" */}
                {showInjuryEditor ? (
                  <SearchableSelect
                    items={health.injuries}
                    selectedIds={health.injuryIds}
                    onSelectionChange={health.setInjuryIds}
                    placeholder="Buscar lesión"
                    cardTitle="Lesiones"
                    cardSubtitle="La rutina las va a tener en cuenta"
                    cardIconName="bandage-outline"
                  />
                ) : (
                  <SectionCard
                    icon={<Ionicons name="bandage-outline" size={20} color="#a1a1aa" />}
                    title="Lesiones"
                    subtitle="La rutina las va a tener en cuenta"
                  >
                    {(options?.injuries.length ?? 0) > 0 ? (
                      <InfoChips items={options!.injuries} />
                    ) : (
                      <Text className="text-zinc-400 text-sm mb-3">
                        No tenés lesiones registradas.
                      </Text>
                    )}
                    <AddInlineButton
                      label={(options?.injuries.length ?? 0) > 0 ? 'Agregar o quitar' : 'Agregar lesión'}
                      onPress={() => setShowInjuryEditor(true)}
                    />
                  </SectionCard>
                )}

                {/* Afecciones: solo las habilitadas para IA; colapsada hasta "Agregar" */}
                {showConditionEditor ? (
                  <SearchableSelect
                    items={health.conditions}
                    selectedIds={health.conditionIds}
                    onSelectionChange={health.setConditionIds}
                    placeholder="Buscar afección"
                    cardTitle="Afecciones médicas"
                    cardSubtitle="Se habilitan para la IA al agregarlas"
                    cardIconName="medkit-outline"
                  />
                ) : (
                  <SectionCard
                    icon={<Ionicons name="medkit-outline" size={20} color="#a1a1aa" />}
                    title="Afecciones médicas"
                    subtitle="Las que tenés habilitadas para la IA"
                  >
                    {(options?.approvedMedicalConditions.length ?? 0) > 0 ? (
                      <InfoChips items={options!.approvedMedicalConditions} />
                    ) : (
                      <Text className="text-zinc-400 text-sm mb-3">
                        No tenés afecciones habilitadas para la IA.
                      </Text>
                    )}
                    <AddInlineButton
                      label={
                        (options?.approvedMedicalConditions.length ?? 0) > 0
                          ? 'Agregar o quitar'
                          : 'Agregar afección'
                      }
                      onPress={() => setShowConditionEditor(true)}
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
                  disabled={!canGenerate}
                  activeOpacity={0.85}
                  style={{ backgroundColor: '#a3e635', opacity: canGenerate ? 1 : 0.5 }}
                  className="flex-row items-center justify-center gap-2 py-4 rounded-full"
                >
                  <Ionicons name="sparkles" size={18} color="#18181b" />
                  <Text className="text-zinc-900 font-bold text-base">Generar rutina</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
    </View>
  );
}
