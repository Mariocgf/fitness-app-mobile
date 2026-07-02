import { logger } from '@/src/utils/logger';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Phase } from './useActiveSession';

interface UseSessionAudioProps {
  /** Tiempo restante del cronómetro activo (REST o EXERCISE timed). null si no aplica. */
  timeLeft: number | null;
  /** Fase actual de la sesión */
  phase: Phase;
}

const SESSION_AUDIO_MODE = {
  allowsRecordingIOS: false,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
};

const SHORT_BEEP_URI = createBeepUri(880, 200, 0.8);
const FINAL_BEEP_URI = createBeepUri(440, 800, 1.0);

type PreloadedSessionSounds = {
  shortBeep: Audio.Sound | null;
  finalBeep: Audio.Sound | null;
};

async function configureSessionAudio(): Promise<void> {
  // El modo de audio nativo (ducking, background, earpiece) no aplica en web.
  if (Platform.OS === 'web') return;
  await Audio.setAudioModeAsync(SESSION_AUDIO_MODE);
}

async function createPreloadedSound(uri: string, volume: number): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false, volume }
  );
  return sound;
}

function createBeepUri(frequency: number, durationMs: number, volume: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const channelData = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - (i / numSamples) * 2);
    channelData[i] = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
  }

  return `data:audio/wav;base64,${float32ToWavBase64(channelData, sampleRate)}`;
}

async function replaySound(sound: Audio.Sound | null): Promise<boolean> {
  if (!sound) return false;

  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return false;

    if (status.isPlaying) {
      await sound.stopAsync();
    }

    await sound.setPositionAsync(0);
    await sound.playAsync();
    return true;
  } catch (error) {
    logger.warn('[useSessionAudio] Error reproduciendo audio precargado:', error);
    return false;
  }
}

/**
 * Genera un beep sintético usando expo-av con Web Audio API (expo-av AudioContext).
 * Devuelve una función que reproduce el beep dado un volumen y duración.
 */
async function playBeep(
  frequency: number,
  durationMs: number,
  volume: number = 1.0
): Promise<void> {
  try {
    await configureSessionAudio();
    const uri = createBeepUri(frequency, durationMs, volume);

    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    /* Silenciar errores de audio para no interrumpir la sesión */
    logger.warn('[useSessionAudio] Error reproduciendo beep:', error);
  }
}

/**
 * Convierte un Float32Array de muestras de audio a una cadena Base64 de un archivo WAV.
 */
function float32ToWavBase64(samples: Float32Array, sampleRate: number): string {
  const numSamples = samples.length;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  /* Cabecera RIFF */
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  /* Sub-chunk fmt */
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);        /* Tamaño del sub-chunk */
  view.setUint16(20, 1, true);         /* PCM = 1 */
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  /* Sub-chunk data */
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  /* Muestras de audio: Float32 → Int16 */
  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  /* Convertir ArrayBuffer a Base64 */
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Pronuncia "Quedan 10 segundos" en español rioplatense */
function speakTenSeconds(): void {
  Speech.speak('Quedan 10 segundos', {
    language: 'es-AR',
    pitch: 1.0,
    rate: 0.9,
    useApplicationAudioSession: false,
  });
}

/**
 * Hook que reacciona al tiempo restante de un cronómetro y emite alertas auditivas:
 * - 10 s → voz: "Quedan 10 segundos"
 * - 3, 2, 1 s → beep corto (880 Hz, 200 ms)
 * - 0 s → beep sostenido final (440 Hz, 800 ms)
 */
export function useSessionAudio({ timeLeft, phase }: UseSessionAudioProps): void {
  /* Refs de guardia para evitar disparos duplicados por re-renders */
  const spokenTenRef = useRef(false);
  const beepedSecondsRef = useRef<Set<number>>(new Set());
  const shortBeepInFlightRef = useRef(false);
  const finalBeepInFlightRef = useRef(false);
  const soundsRef = useRef<PreloadedSessionSounds>({
    shortBeep: null,
    finalBeep: null,
  });

  /* Precalentar audio al montar: si esperamos al segundo 3, ya llegamos tarde. */
  useEffect(() => {
    let cancelled = false;

    async function preloadAudio(): Promise<void> {
      try {
        await configureSessionAudio();

        const [shortBeep, finalBeep] = await Promise.all([
          createPreloadedSound(SHORT_BEEP_URI, 0.8),
          createPreloadedSound(FINAL_BEEP_URI, 1.0),
        ]);

        if (cancelled) {
          await Promise.all([shortBeep.unloadAsync(), finalBeep.unloadAsync()]);
          return;
        }

        soundsRef.current = { shortBeep, finalBeep };

        /* Inicializa el bridge/engine de speech antes del primer descanso. */
        void Speech.getAvailableVoicesAsync().catch((error) => {
          logger.warn('[useSessionAudio] No se pudo precalentar speech:', error);
        });
      } catch (error) {
        logger.warn('[useSessionAudio] No se pudo precargar audio:', error);
      }
    }

    void preloadAudio();

    return () => {
      cancelled = true;
      const { shortBeep, finalBeep } = soundsRef.current;
      soundsRef.current = { shortBeep: null, finalBeep: null };
      void Promise.all([
        shortBeep?.unloadAsync(),
        finalBeep?.unloadAsync(),
      ]);
      Speech.stop();
    };
  }, []);

  /* Resetear los flags cuando cambia la fase (nuevo ciclo de cronómetro) */
  useEffect(() => {
    spokenTenRef.current = false;
    beepedSecondsRef.current = new Set();
  }, [phase]);

  useEffect(() => {
    /* Solo actuar en fases con cronómetro descendente */
    if (phase !== 'REST' && phase !== 'EXERCISE') return;
    if (timeLeft === null) return;

    /* Voz a los 10 segundos */
    if (timeLeft === 10 && !spokenTenRef.current) {
      spokenTenRef.current = true;
      speakTenSeconds();
      return;
    }

    /* Beeps cortos a 3, 2, 1 */
    if (timeLeft >= 1 && timeLeft <= 3 && !beepedSecondsRef.current.has(timeLeft)) {
      beepedSecondsRef.current.add(timeLeft);

      if (shortBeepInFlightRef.current) return;

      shortBeepInFlightRef.current = true;
      /* Cortamos cualquier voz tardía para que no empuje los beeps al segundo 2/1. */
      Speech.stop();
      void replaySound(soundsRef.current.shortBeep).then((played) => {
        if (!played) void playBeep(880, 200, 0.8);
      }).finally(() => {
        shortBeepInFlightRef.current = false;
      });
      return;
    }

    /* Beep sostenido al llegar a 0 */
    if (timeLeft === 0 && !beepedSecondsRef.current.has(0)) {
      beepedSecondsRef.current.add(0);
      if (finalBeepInFlightRef.current) return;

      finalBeepInFlightRef.current = true;
      Speech.stop();
      void replaySound(soundsRef.current.finalBeep).then((played) => {
        if (!played) void playBeep(440, 800, 1.0);
      }).finally(() => {
        finalBeepInFlightRef.current = false;
      });
    }
  }, [timeLeft, phase]);
}
