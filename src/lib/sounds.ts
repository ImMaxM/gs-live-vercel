"use client";

// Web Audio API based sound generator for race events
// Creates pleasing notification tones without needing audio files

type SoundType = "yellow" | "red" | "green" | "message";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

// Play a tone with optional harmonics for richer sound
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.15,
) {
  const ctx = getAudioContext();

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Fade out envelope for pleasant sound
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// Play a sequence of tones
function playSequence(
  notes: { freq: number; duration: number; delay: number }[],
  type: OscillatorType = "sine",
  volume: number = 0.15,
) {
  notes.forEach((note) => {
    setTimeout(() => {
      playTone(note.freq, note.duration, type, volume);
    }, note.delay * 1000);
  });
}

export const sounds = {
  // Yellow/SC/VSC - Warning chime (two descending tones)
  yellow: () => {
    playSequence(
      [
        { freq: 880, duration: 0.15, delay: 0 }, // A5
        { freq: 659, duration: 0.2, delay: 0.12 }, // E5
      ],
      "triangle",
      0.12,
    );
  },

  // Red flag - Urgent double beep
  red: () => {
    playSequence(
      [
        { freq: 523, duration: 0.15, delay: 0 }, // C5
        { freq: 523, duration: 0.15, delay: 0.2 }, // C5
        { freq: 392, duration: 0.25, delay: 0.4 }, // G4
      ],
      "square",
      0.08,
    );
  },

  // Green flag - Pleasant ascending chime
  green: () => {
    playSequence(
      [
        { freq: 523, duration: 0.12, delay: 0 }, // C5
        { freq: 659, duration: 0.12, delay: 0.1 }, // E5
        { freq: 784, duration: 0.2, delay: 0.2 }, // G5
      ],
      "sine",
      0.12,
    );
  },

  // New race control message - Subtle notification
  message: () => {
    playTone(1047, 0.08, "sine", 0.1); // C6 - short ping
  },
};

export function playSound(type: SoundType) {
  try {
    sounds[type]();
  } catch (e) {
    console.warn("Failed to play sound:", e);
  }
}
