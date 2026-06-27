import { Picker } from "@react-native-picker/picker";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";

/** Acento del valor seleccionado (color del módulo). */
type DurationAccent = "rose" | "lime" | "amber" | "mono";

const ACCENT_COLOR: Record<DurationAccent, string> = {
  rose: "#fb7185",
  lime: "#a3e635",
  amber: "#fbbf24",
  mono: "#ffffff",
};

interface DurationWheelPickerProps {
  /** Horas seleccionadas. */
  hours: number;
  /** Minutos seleccionados. */
  minutes: number;
  /** Callback con las nuevas horas/minutos. */
  onChange: (hours: number, minutes: number) => void;
  /** Hora máxima del rango (default 12). */
  maxHours?: number;
  /** Salto entre minutos (default 15 → 00/15/30/45). */
  minuteStep?: number;
  /** Color de acento del valor (default 'mono'). */
  accent?: DurationAccent;
  /** Alto del wheel en iOS (default 180). */
  wheelHeight?: number;
}

/** Alto de la fila resaltada central. */
const ROW_HEIGHT = 44;

/**
 * Selector de duración horas + minutos con el control NATIVO del SO
 * (`@react-native-picker/picker`): en iOS son dos wheels girables, en Android
 * dos dropdowns. Al ser nativo no pelea con el responder system del `ScrollView`
 * padre (a diferencia de un wheel JS, que entraría en conflicto de gesto —
 * lección documentada en `agent-implementation-lessons.md`).
 *
 * Reutilizar para cargar una duración h+min (sueño, y a futuro meditación) en vez
 * de cablear dos `Picker` inline. El resumen total ("480 min") lo pone el consumidor.
 */
export default function DurationWheelPicker({
  hours,
  minutes,
  onChange,
  maxHours = 12,
  minuteStep = 15,
  accent = "mono",
  wheelHeight = 180,
}: DurationWheelPickerProps) {
  const isIOS = Platform.OS === "ios";
  const accentColor = ACCENT_COLOR[accent];

  const hourItems = useMemo(() => {
    const out: number[] = [];
    for (let h = 0; h <= maxHours; h += 1) out.push(h);
    return out;
  }, [maxHours]);

  const minuteItems = useMemo(() => {
    const out: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) out.push(m);
    return out;
  }, [minuteStep]);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  return (
    <View
      className="flex-row items-center"
      style={{ height: isIOS ? wheelHeight : 56 }}
    >
      {/* Banda resaltada central (solo iOS; en Android el dropdown ya resalta). */}
      {isIOS && (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 bg-zinc-800 rounded-xl"
          style={{ top: wheelHeight / 2 - ROW_HEIGHT / 2, height: ROW_HEIGHT }}
        />
      )}

      {/* Columna de horas */}
      <View className="flex-1 flex-row items-center justify-center">
        <Picker
          selectedValue={hours}
          onValueChange={(v) => onChange(Number(v), minutes)}
          style={{ width: 90, color: accentColor }}
          itemStyle={{ color: accentColor, fontSize: 22 }}
          dropdownIconColor="#a1a1aa"
        >
          {hourItems.map((h) => (
            <Picker.Item key={h} label={String(h)} value={h} color={accentColor} />
          ))}
        </Picker>
        <Text className="text-base text-zinc-500 ml-1">h</Text>
      </View>

      <View className="w-px bg-zinc-700" style={{ height: ROW_HEIGHT }} />

      {/* Columna de minutos */}
      <View className="flex-1 flex-row items-center justify-center">
        <Picker
          selectedValue={minutes}
          onValueChange={(v) => onChange(hours, Number(v))}
          style={{ width: 90, color: accentColor }}
          itemStyle={{ color: accentColor, fontSize: 22 }}
          dropdownIconColor="#a1a1aa"
        >
          {minuteItems.map((m) => (
            <Picker.Item key={m} label={pad2(m)} value={m} color={accentColor} />
          ))}
        </Picker>
        <Text className="text-base text-zinc-500 ml-1">min</Text>
      </View>
    </View>
  );
}
