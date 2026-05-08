import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, LayoutChangeEvent, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  SlideInDown,
  SlideOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SessionDay, SessionLog, ExerciseLog } from '../../../../types/session';

type Phase = 'COUNTDOWN' | 'EXERCISE' | 'REST' | 'SUMMARY';

interface ActiveSessionViewProps {
  routineId: string;
  day: SessionDay;
  onFinishSession?: (log: SessionLog) => void;
  onCancel?: () => void;
}

/* ────────────────────────────── helpers ────────────────────────────── */

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/* ────────────────────── RPE Slider (gesture-handler) ────────────────────── */

const RPESlider = ({
  value,
  onValueChange,
  min = 0,
  max = 10,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
}) => {
  const trackLayoutRef = useRef({ width: 0 });

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const resolveValue = (localX: number) => {
    const trackW = trackLayoutRef.current.width;
    if (trackW === 0) return value;
    let pct = localX / trackW;
    pct = Math.max(0, Math.min(1, pct));
    return clamp(Math.round(min + pct * (max - min)));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      onValueChange(resolveValue(e.x));
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      onValueChange(resolveValue(e.x));
    });

  const composed = Gesture.Race(pan, tap);

  const percentage = (value - min) / (max - min);

  return (
    <View className="w-full flex-row items-center py-4 px-5">
      <Text className="text-white font-bold text-lg mr-4">{min}</Text>
      <GestureDetector gesture={composed}>
        <View
          className="flex-1 h-10 justify-center"
          onLayout={(e: LayoutChangeEvent) => {
            trackLayoutRef.current = { width: e.nativeEvent.layout.width };
          }}
        >
          {/* Track bg */}
          <View className="h-2 bg-zinc-700 rounded-full w-full" />
          {/* Track fill */}
          <View
            className="absolute h-2 bg-lime-300 rounded-full"
            style={{ width: `${percentage * 100}%` }}
          />
          {/* Thumb */}
          <View
            className="absolute w-8 h-8 bg-lime-300 rounded-full items-center justify-center border-4 border-zinc-900"
            style={{
              left: `${percentage * 100}%`,
              transform: [{ translateX: -16 }],
            }}
          >
            <Text className="text-black font-bold text-xs">{value}</Text>
          </View>
        </View>
      </GestureDetector>
      <Text className="text-white font-bold text-lg ml-4">{max}</Text>
    </View>
  );
};

/* ────────────────────── Clock ring ────────────────────── */

const ClockCircle = ({
  isRestPhase,
  restTimeLeft,
  initialRest,
  globalTime,
  sizeOverride,
}: {
  isRestPhase: boolean;
  restTimeLeft: number;
  initialRest: number;
  globalTime: number;
  sizeOverride?: number;
}) => {
  const size = sizeOverride ? sizeOverride : (isRestPhase ? 240 : 120);
  const strokeWidth = isRestPhase ? 6 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = isRestPhase
    ? initialRest > 0
      ? restTimeLeft / initialRest
      : 0
    : 1;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View
      className="items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <Circle
          stroke="#3f3f46"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Foreground ring */}
        <Circle
          stroke="#d9f99d"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        {isRestPhase && (
          <Text className="text-zinc-300 text-sm mb-1">Descanso</Text>
        )}
        <Text
          className={`text-white font-bold ${isRestPhase ? 'text-5xl' : 'text-3xl'}`}
        >
          {isRestPhase ? formatTime(restTimeLeft) : formatTime(globalTime)}
        </Text>
        {isRestPhase && (
          <Text className="text-zinc-400 text-sm mt-1">
            {formatTime(globalTime)}
          </Text>
        )}
      </View>
    </View>
  );
};

/* ────────────────────── GIF Wrapper ────────────────────── */
const ExerciseGif = React.memo(({ uri }: { uri: string }) => {
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%', borderRadius: 24 }}
      contentFit="cover"
      cachePolicy="memory"
    />
  );
});

/* ════════════════════════════════════════════════════════════════════ */
/*                      MAIN COMPONENT                                */
/* ════════════════════════════════════════════════════════════════════ */

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  routineId,
  day,
  onFinishSession,
  onCancel,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  const dynamicClockSize = screenWidth * 0.40; // 40% del ancho de pantalla

  const [phase, setPhase] = useState<Phase>('COUNTDOWN');
  const [countdown, setCountdown] = useState(3);

  const [globalTime, setGlobalTime] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [rpe, setRpe] = useState(5);
  const [rpeSaved, setRpeSaved] = useState(false);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);

  const currentExercise = day.exercises[exerciseIndex];
  const totalSets = parseInt(currentExercise?.sets) || 1;
  const initialRest = parseInt(currentExercise?.rest) || 60;

  /* ── countdown ── */
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    // show "¡Vamos!" for 1 s then start
    const t = setTimeout(() => setPhase('EXERCISE'), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  /* ── global timer ── */
  useEffect(() => {
    if (phase !== 'EXERCISE' && phase !== 'REST') return;
    const t = setInterval(() => setGlobalTime((g) => g + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  /* ── rest countdown ── */
  useEffect(() => {
    if (phase !== 'REST') return;
    if (restTimeLeft <= 0) return;
    const t = setInterval(() => {
      setRestTimeLeft((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, restTimeLeft > 0]);

  /* ── auto-advance when rest reaches 0 ── */
  useEffect(() => {
    if (phase === 'REST' && restTimeLeft === 0 && initialRest > 0) {
      // small delay so the user sees 00:00
      const t = setTimeout(() => advanceAfterRest(), 500);
      return () => clearTimeout(t);
    }
  }, [phase, restTimeLeft]);

  /* ── helpers ── */

  const saveCurrentLog = useCallback(
    (finalRpe: number) => {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.exerciseId === currentExercise.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], rpe: finalRpe };
          return copy;
        }
        return [
          ...prev,
          { exerciseId: currentExercise.id, rpe: finalRpe, totalWeight: 0 },
        ];
      });
    },
    [currentExercise?.id],
  );

  const advanceAfterRest = useCallback(() => {
    // save rpe (if the user never pressed "Guardar", default 5)
    if (!rpeSaved) saveCurrentLog(rpe);

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
    } else {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
    setRpeSaved(false);
    setRpe(5);
    setPhase('EXERCISE');
  }, [currentSet, totalSets, rpe, rpeSaved, saveCurrentLog]);

  const handleFinishSet = () => {
    const isLastSet = currentSet >= totalSets;
    const isLastExercise = exerciseIndex >= day.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      saveCurrentLog(5);
      setPhase('SUMMARY');
      return;
    }

    // Increment set counter BEFORE entering rest (e.g. 1/3 → 2/3)
    setRestTimeLeft(initialRest);
    setRpe(5);
    setRpeSaved(false);
    setPhase('REST');
  };

  const handleFinishRest = () => {
    advanceAfterRest();
  };

  const handleFinishSessionEarly = () => {
    Alert.alert(
      'Finalizar Sesión',
      '¿Estás seguro que deseas finalizar la sesión antes de tiempo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => setPhase('SUMMARY'),
        },
      ],
    );
  };

  const handleSaveSession = () => {
    // Backend expects a TimeSpan parseable format like "HH:mm:ss"
    const h = Math.floor(globalTime / 3600).toString().padStart(2, '0');
    const m = Math.floor((globalTime % 3600) / 60).toString().padStart(2, '0');
    const s = (globalTime % 60).toString().padStart(2, '0');

    const log: SessionLog = {
      routineId,
      trainedAt: new Date().toISOString(),
      totalTime: `${h}:${m}:${s}`,
      exercises: logs,
    };
    onFinishSession?.(log);
  };

  /* ── guards ── */
  if (!currentExercise && phase !== 'SUMMARY') return null;

  /* ══════════════════════ COUNTDOWN ══════════════════════ */
  if (phase === 'COUNTDOWN') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Animated.Text
          key={countdown}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          className="text-lime-300 text-8xl font-black"
        >
          {countdown > 0 ? countdown : '¡Vamos!'}
        </Animated.Text>
      </View>
    );
  }

  /* ══════════════════════ SUMMARY ══════════════════════ */
  if (phase === 'SUMMARY') {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
        <Ionicons name="trophy" size={80} color="#d9f99d" />
        <Text className="text-white text-3xl font-bold mb-2 mt-6">
          ¡Entrenamiento terminado!
        </Text>
        <Text className="text-zinc-400 text-lg mb-10">
          Tiempo total: {formatTime(globalTime)}
        </Text>

        <TouchableOpacity
          className="bg-lime-300 w-full p-4 rounded-xl items-center"
          onPress={handleSaveSession}
        >
          <Text className="text-black font-bold text-lg">Guardar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ══════════════════════ EXERCISE / REST ══════════════════════ */
  return (
    <View className="flex-1 bg-zinc-950 p-4 pt-14">
      <Text className="text-white text-xl font-bold text-center mb-6">
        Entrenamiento
      </Text>

      <View className="flex-1 justify-between">
        {/* ──── upper area ──── */}
        <View className="w-full mb-4">
          {phase === 'EXERCISE' ? (
            <Animated.View
              key={`ex-${exerciseIndex}-${currentSet}`}
              entering={SlideInDown.duration(400)}
              exiting={SlideOutUp.duration(300)}
              className="items-center w-full"
            >
              {/* GIF with expo-image for animated gif support */}
              <View className="bg-zinc-900 rounded-3xl overflow-hidden w-full aspect-square mb-4 items-center justify-center">
                {currentExercise.gifUrl ? (
                  <ExerciseGif uri={currentExercise.gifUrl} />
                ) : (
                  <Ionicons name="image-outline" size={60} color="#555" />
                )}
              </View>

              {/* Stats chips */}
              <View className="bg-zinc-900 rounded-2xl p-4 w-full flex-row justify-between border border-zinc-800">
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentSet}/{totalSets}
                  </Text>
                  <Text className="text-zinc-400 text-xs">Series</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentExercise.reps}
                  </Text>
                  <Text className="text-zinc-400 text-xs">Repeticiones</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Text className="text-lime-300 font-bold text-lg">
                    {currentExercise.rest}s
                  </Text>
                  <Text className="text-zinc-400 text-xs">Descanso</Text>
                </View>
                <View className="w-px bg-zinc-800" />
                <View className="items-center flex-1">
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#d9f99d"
                  />
                  <Text className="text-zinc-400 text-xs">Info</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              key="rest-view"
              entering={SlideInUp.duration(400)}
              exiting={SlideOutDown.duration(300)}
              className="items-center w-full"
            >
              {/* Large rest clock */}
              <ClockCircle
                isRestPhase
                restTimeLeft={restTimeLeft}
                initialRest={initialRest}
                globalTime={globalTime}
              />

              {/* RPE slider */}
              <View className="w-full mt-8">
                <Text className="text-white font-bold text-lg ml-2 mb-2">
                  Esfuerzo percibido
                </Text>
                <View className="bg-zinc-900 rounded-2xl border border-zinc-800 pb-2">
                  <RPESlider value={rpe} onValueChange={setRpe} />
                </View>

                <TouchableOpacity
                  className="bg-lime-300 w-full p-4 rounded-xl items-center mt-4"
                  onPress={() => {
                    saveCurrentLog(rpe);
                    setRpeSaved(true);
                  }}
                >
                  <Text className="text-black font-bold text-base">
                    {rpe >= 4 && rpe <= 6
                      ? 'Guardar RPE'
                      : 'Guardar y actualizar serie'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>

        {/* ──── bottom actions ──── */}
        <View className="w-full flex-1 justify-end">
          {phase === 'EXERCISE' ? (
            /* Exercise phase: clock + Finalizar Serie side by side */
            <View className="flex-row items-center justify-between mb-4 flex-1">
              <View className="flex-1 items-center justify-center">
                <ClockCircle
                  isRestPhase={false}
                  restTimeLeft={0}
                  initialRest={0}
                  globalTime={globalTime}
                  sizeOverride={dynamicClockSize}
                />
              </View>
              <TouchableOpacity
                className="bg-lime-300 rounded-2xl w-1/2 h-[120px] justify-center items-center ml-4"
                onPress={handleFinishSet}
              >
                <Text className="text-black font-bold text-xl text-center">
                  {'Finalizar\nSerie'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Rest phase: Finalizar Descanso */
            <View className="flex-1 mb-4 mt-8 justify-center">
              <TouchableOpacity
                className="bg-lime-300 rounded-2xl w-full h-[120px] justify-center items-center"
                onPress={handleFinishRest}
              >
                <Text className="text-black font-bold text-xl text-center">
                  Finalizar Descanso
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            className="bg-red-500 w-full py-4 rounded-xl items-center"
            onPress={handleFinishSessionEarly}
          >
            <Text className="text-white font-bold text-lg">
              Finalizar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
