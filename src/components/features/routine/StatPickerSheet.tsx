import { CreateRoutineDay } from '@/src/types/create-routine';
import { WeightOption } from '@/src/utils/weight.utils';
import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

/* ── Wheel picker (scroll vertical estilo iOS) — puro JS, Expo Go OK ───────── */

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5; // 2 arriba + centro + 2 abajo
const WEB_SETTLE_MS = 140;

const isWeb = Platform.OS === 'web';

const WheelPicker = ({ items, value, onChange }: {
  items: { value: number | null; label: string }[];
  value: number | null;
  onChange: (value: number | null) => void;
}) => {
  const ref = useRef<ScrollView>(null);
  const didInit = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialIndex = Math.max(0, items.findIndex(i => i.value === value));

  const commitOffset = (y: number) => {
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(y / WHEEL_ITEM_H)));
    const picked = items[idx];
    if (picked && picked.value !== value) onChange(picked.value);
    return idx;
  };

  const handleMomentumEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    commitOffset(e.nativeEvent.contentOffset.y);
  };

  // react-native-web nunca emite onMomentumScrollEnd ni soporta snapToInterval:
  // su ScrollView solo ata el evento DOM `scroll`. En web el valor se confirma
  // cuando la rueda deja de moverse y se reencuadra al item más cercano a mano.
  const handleWebScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const idx = commitOffset(y);
      const snapped = idx * WHEEL_ITEM_H;
      if (Math.abs(y - snapped) > 1) ref.current?.scrollTo({ y: snapped, animated: true });
    }, WEB_SETTLE_MS);
  };

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE }}>
      {/* Banda central que resalta el valor seleccionado */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: WHEEL_ITEM_H * 2, height: WHEEL_ITEM_H }}
        className="border-y border-white/10 bg-white/5 rounded-xl"
      />
      <ScrollView
        ref={ref}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
        onMomentumScrollEnd={isWeb ? undefined : handleMomentumEnd}
        onScroll={isWeb ? handleWebScroll : undefined}
        scrollEventThrottle={16}
        onLayout={() => {
          if (didInit.current) return;
          didInit.current = true;
          ref.current?.scrollTo({ y: initialIndex * WHEEL_ITEM_H, animated: false });
        }}
      >
        {items.map((it, i) => {
          const selected = it.value === value;
          return (
            <View key={i} style={{ height: WHEEL_ITEM_H }} className="items-center justify-center">
              <Text className={selected ? 'text-white font-bold text-xl' : 'text-zinc-500 text-lg'}>{it.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

/* ── Bottom sheet con wheel picker para Sets / Reps / Rest / Peso ──────────── */

const buildRange = (from: number, to: number, step = 1): { value: number | null; label: string }[] => {
  const arr: { value: number | null; label: string }[] = [];
  for (let n = from; n <= to; n += step) arr.push({ value: n, label: String(n) });
  return arr;
};

/**
 * Garantiza que el peso ya guardado esté entre las opciones del picker.
 *
 * Las opciones se derivan del inventario del usuario y del equipamiento del ejercicio,
 * que carga async: mientras tanto la lista es solo "Peso corporal". Si el ejercicio ya
 * tenía un peso, sin esto el picker abriría en corporal y cualquier scroll confirmaría
 * `null` — sobrescribiendo el peso guardado. Se inserta el valor (ordenado, después de
 * "Peso corporal") para que el picker abra EN él y no se pierda.
 */
const ensureCurrentWeight = (
  options: WeightOption[],
  current: number | null,
): WeightOption[] => {
  if (current == null || options.some((o) => o.value === current)) return options;

  const [bodyweight, ...weights] = options;
  const withCurrent = [...weights, { value: current, label: `${current} kg` }].sort(
    (a, b) => (a.value ?? 0) - (b.value ?? 0),
  );
  return bodyweight?.value == null ? [bodyweight, ...withCurrent] : withCurrent;
};

interface StatPickerSheetProps {
  picker: { exId: string; field: 'sets' | 'reps' | 'restSeconds' | 'weight' } | null;
  days: CreateRoutineDay[];
  weightOptions: WeightOption[];
  onChangeField: (exId: string, field: 'sets' | 'reps' | 'restSeconds', value: string) => void;
  onChangeWeight: (exId: string, value: number | null) => void;
  onClose: () => void;
}

/**
 * Bottom sheet con wheel picker para editar Sets / Reps (o Segundos) / Rest /
 * Peso de un ejercicio del modo edición. El rango se arma según el campo.
 */
export const StatPickerSheet: React.FC<StatPickerSheetProps> = ({
  picker, days, weightOptions, onChangeField, onChangeWeight, onClose,
}) => {
  const exercise = useMemo(() => {
    if (!picker) return null;
    for (const d of days) {
      const ex = d.exercises.find(e => e.id === picker.exId);
      if (ex) return ex;
    }
    return null;
  }, [picker, days]);

  const config = useMemo(() => {
    if (!picker || !exercise) return null;
    switch (picker.field) {
      case 'sets':
        return { title: 'Series', items: buildRange(1, 12), value: exercise.sets as number | null };
      case 'reps':
        return exercise.repMode === 'secs'
          ? { title: 'Segundos', items: buildRange(5, 240, 5), value: exercise.reps as number | null }
          : { title: 'Repeticiones', items: buildRange(1, 50), value: exercise.reps as number | null };
      case 'restSeconds':
        return { title: 'Descanso (seg)', items: buildRange(0, 300, 5), value: exercise.restSeconds as number | null };
      case 'weight':
        return {
          title: 'Peso',
          items: ensureCurrentWeight(weightOptions, exercise.plannedWeightKg),
          value: exercise.plannedWeightKg,
        };
      default:
        return null;
    }
  }, [picker, exercise, weightOptions]);

  const handlePick = (val: number | null) => {
    if (!picker) return;
    if (picker.field === 'weight') onChangeWeight(picker.exId, val);
    else onChangeField(picker.exId, picker.field, String(val ?? 0));
  };

  return (
    <Modal visible={!!picker && !!config} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop y sheet como hermanos: el ScrollView de la rueda scrollea libre */}
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-white">{config?.title}</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5 rounded-full bg-white/10">
              <Text className="text-white font-semibold text-sm">Listo</Text>
            </TouchableOpacity>
          </View>
          {config && (
            <WheelPicker
              key={`${picker?.exId}-${picker?.field}`}
              items={config.items}
              value={config.value}
              onChange={handlePick}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
