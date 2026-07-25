/**
 * Versión WEB de `useSessionAudio` (Metro resuelve este archivo en lugar del nativo).
 *
 * El hook nativo usa `expo-av`, que en web se traduce a un `<audio>` con un WAV en
 * base64 y un `play()`. Eso falla en la PWA: `HTMLMediaElement.play()` devuelve una
 * promesa rechazada (`NotAllowedError`) si el navegador no considera desbloqueado el
 * audio, y `expo-av` no expone ese error → los beeps simplemente nunca sonaban.
 *
 * Acá se usa la Web Audio API directamente:
 * - Un único `AudioContext` compartido, creado perezosamente.
 * - Se lo "desbloquea" (`resume()` + buffer mudo) con el PRIMER gesto del usuario. Es lo
 *   que exigen Chrome/Safari: el resume tiene que salir de un handler de gesto real, no
 *   de un `setTimeout` ni de un `useEffect`.
 * - Los beeps se sintetizan con un oscilador: cero latencia de carga y timing exacto,
 *   que es justo lo que necesita una cuenta regresiva de 3-2-1.
 */
import { logger } from '@/src/utils/logger';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { Phase } from './useActiveSession';

interface UseSessionAudioProps {
  /** Tiempo restante del cronómetro activo (REST o EXERCISE timed). null si no aplica. */
  timeLeft: number | null;
  /** Fase actual de la sesión */
  phase: Phase;
}

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;

let audioContext: AudioContext | null = null;
let isUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;

  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioContext = new Ctor();
    return audioContext;
  } catch (error) {
    logger.warn('[useSessionAudio.web] No se pudo crear el AudioContext:', error);
    return null;
  }
}

/**
 * Desbloquea el audio del navegador. DEBE llamarse desde un gesto del usuario.
 * Además del `resume()`, reproduce un buffer mudo: es el truco que necesita Safari/iOS
 * para marcar el contexto como habilitado.
 */
function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().catch(() => {});

  try {
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* Si el buffer mudo falla, el `resume()` de arriba ya cubre Chrome. */
  }

  /* La síntesis de voz arrastra la misma política: una utterance muda dentro del gesto
     inicializa el motor para que el aviso de los 10 s no se pierda. */
  try {
    const synth = window.speechSynthesis;
    if (synth) {
      const warmup = new SpeechSynthesisUtterance(' ');
      warmup.volume = 0;
      synth.speak(warmup);
    }
  } catch {
    /* speechSynthesis no disponible: el resto del audio sigue funcionando. */
  }

  isUnlocked = true;
}

/**
 * Sintetiza un beep. El envelope replica al del hook nativo: arranca en `volume` y cae
 * a silencio a mitad de la duración, así el 3-2-1 suena seco y no arrastra cola.
 */
function playBeep(frequency: number, durationMs: number, volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  /* Si el contexto quedó suspendido (cambio de pestaña, política del navegador) se
     reintenta: sin esto el oscilador arranca y no suena nada. */
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  try {
    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + durationSec / 2);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch (error) {
    logger.warn('[useSessionAudio.web] Error reproduciendo beep:', error);
  }
}

/** Pronuncia "Quedan 10 segundos" en español rioplatense */
function speakTenSeconds(): void {
  Speech.speak('Quedan 10 segundos', {
    language: 'es-AR',
    pitch: 1.0,
    rate: 0.9,
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

  /* Desbloqueo: el usuario ya tocó algo para llegar acá, pero ese gesto vivió en otra
     pantalla. Enganchamos el primer gesto DENTRO de la sesión (tocar un botón, la
     pantalla, lo que sea) y ahí sí habilitamos el contexto. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* Chrome mantiene la activación a nivel documento: si ya hubo un gesto previo, este
       resume alcanza y los beeps funcionan desde el primer descanso. */
    unlockAudio();

    if (isUnlocked && audioContext?.state === 'running') return;

    const handler = () => unlockAudio();
    UNLOCK_EVENTS.forEach((event) =>
      window.addEventListener(event, handler, { capture: true, once: true }),
    );

    return () => {
      UNLOCK_EVENTS.forEach((event) =>
        window.removeEventListener(event, handler, { capture: true }),
      );
    };
  }, []);

  /* Resetear los flags cuando cambia la fase (nuevo ciclo de cronómetro) */
  useEffect(() => {
    spokenTenRef.current = false;
    beepedSecondsRef.current = new Set();
  }, [phase]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

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
      /* Cortamos cualquier voz tardía para que no empuje los beeps al segundo 2/1. */
      Speech.stop();
      playBeep(880, 200, 0.8);
      return;
    }

    /* Beep sostenido al llegar a 0 */
    if (timeLeft === 0 && !beepedSecondsRef.current.has(0)) {
      beepedSecondsRef.current.add(0);
      Speech.stop();
      playBeep(440, 800, 1.0);
    }
  }, [timeLeft, phase]);
}
