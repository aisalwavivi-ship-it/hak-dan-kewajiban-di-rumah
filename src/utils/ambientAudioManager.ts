/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomId, TimeOfDay } from '../types';

/**
 * Background Audio & Gamification Music Manager
 * Synthesizes:
 * 1. Gentle, cheerful educational game instrumental music (marimba, kalimba, music-box)
 * 2. Natural context ambient soundscape (birds, breeze, crickets, gentle water)
 * 
 * Rules:
 * - Suara latar lirih saja (soft, unobtrusive, warm, child-friendly).
 * - Perfectly seamless looping without clicks or gaps.
 * - Smooth crossfade transitions between PAGI, SIANG, and MALAM.
 * - Controlled by the app's master mute toggle.
 * - Auto-ducks during voice narration.
 */
class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentContextGain: GainNode | null = null;
  private currentRoom: RoomId | null = null;
  private currentTime: TimeOfDay = 'pagi';
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private activeNodes: Array<{ stop: () => void }> = [];
  private periodicTimers: number[] = [];
  private musicStepIndex: number = 0;

  // Calibrated comfortable soft background volume ceiling
  private defaultMasterVolume: number = 0.22;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.resumeIfNeeded();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  public resumeIfNeeded() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  private init() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.defaultMasterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Duck background music slightly during character voiceovers so speech is crystal clear.
   */
  public duck(isDucked: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const target = isDucked ? 0.05 : this.defaultMasterVolume;
    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.25);
    } catch {
      // Ignored
    }
  }

  /**
   * Updates ambient audio dynamically when room, time of day, or mute state changes.
   */
  public update(room: RoomId | null, time: TimeOfDay, isMuted: boolean) {
    this.isMuted = isMuted;

    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended' && !isMuted) {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    if (isMuted) {
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      } catch {}
      this.clearCurrentNodes();
      return;
    } else {
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(this.defaultMasterVolume, now + 0.35);
      } catch {}
    }

    const hasChanged = this.currentRoom !== room || this.currentTime !== time;
    this.currentRoom = room;
    this.currentTime = time;

    if (hasChanged || !this.isRunning) {
      this.transitionToContext(room, time);
    }
  }

  /**
   * Crossfades smoothly from previous soundscape to the new context.
   */
  private transitionToContext(room: RoomId | null, time: TimeOfDay) {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      this.clearCurrentNodes();
      return;
    }

    const now = this.ctx.currentTime;

    // Smoothly fade out the current active soundscape
    if (this.currentContextGain) {
      try {
        this.currentContextGain.gain.cancelScheduledValues(now);
        this.currentContextGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        // Ignored
      }
    }

    // Clear old timers and stop old audio nodes after crossfade delay
    const oldNodes = [...this.activeNodes];
    const oldTimers = [...this.periodicTimers];
    oldTimers.forEach((t) => window.clearTimeout(t));
    this.periodicTimers = [];
    this.activeNodes = [];
    this.musicStepIndex = 0;

    setTimeout(() => {
      oldNodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          // Ignored
        }
      });
    }, 380);

    // Create a new context gain node with smooth fade-in
    const newContextGain = this.ctx.createGain();
    newContextGain.gain.setValueAtTime(0.0001, now);
    newContextGain.gain.linearRampToValueAtTime(1.0, now + 0.45);
    newContextGain.connect(this.masterGain);
    this.currentContextGain = newContextGain;

    this.isRunning = true;

    // Start background gamification music loop for current time
    this.startGamifiedMusicLoop(time, newContextGain);

    // Blend with room/time natural ambient soundscape
    if (room === 'taman') {
      this.playGardenAmbience(time, newContextGain);
    } else if (room === 'dapur') {
      this.playKitchenAmbience(time, newContextGain);
    } else if (room === 'kamar-mandi') {
      this.playBathroomAmbience(newContextGain);
    } else if (room === 'kamar-tidur') {
      this.playBedroomAmbience(time, newContextGain);
    } else if (room === 'ruang-tamu') {
      this.playLivingRoomAmbience(time, newContextGain);
    } else {
      // General House Overview
      this.playHouseAmbience(time, newContextGain);
    }
  }

  private clearCurrentNodes() {
    this.periodicTimers.forEach((timer) => window.clearTimeout(timer));
    this.periodicTimers = [];

    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignored
      }
    });
    this.activeNodes = [];
    this.isRunning = false;
  }

  // =========================================================================
  // INSTRUMENTAL GAMIFICATION BACKGROUND MUSIC SEQUENCER
  // Marimba, Kalimba & Bell Tones — Lirih, Hangat, Ceria & Menyenangkan
  // =========================================================================
  private startGamifiedMusicLoop(time: TimeOfDay, targetGain: GainNode) {
    if (!this.ctx) return;

    // Pleasant melodies tailored to time of day
    let melodyNotes: Array<{ freq: number; dur: number; bassFreq?: number }>;
    let stepIntervalMs: number;

    if (time === 'pagi') {
      // PAGI: Cheerful, upbeat morning adventure theme (C Major / Marimba groove)
      stepIntervalMs = 420;
      melodyNotes = [
        { freq: 523.25, dur: 0.28, bassFreq: 130.81 }, // C5 + C3
        { freq: 659.25, dur: 0.26 },                   // E5
        { freq: 783.99, dur: 0.26 },                   // G5
        { freq: 659.25, dur: 0.24 },                   // E5
        { freq: 880.00, dur: 0.32, bassFreq: 174.61 }, // A5 + F3
        { freq: 783.99, dur: 0.26 },                   // G5
        { freq: 659.25, dur: 0.24 },                   // E5
        { freq: 587.33, dur: 0.30 },                   // D5
        { freq: 523.25, dur: 0.28, bassFreq: 146.83 }, // C5 + D3
        { freq: 587.33, dur: 0.26 },                   // D5
        { freq: 659.25, dur: 0.28 },                   // E5
        { freq: 783.99, dur: 0.34, bassFreq: 196.00 }, // G5 + G3
        { freq: 880.00, dur: 0.26 },                   // A5
        { freq: 783.99, dur: 0.26 },                   // G5
        { freq: 659.25, dur: 0.28 },                   // E5
        { freq: 523.25, dur: 0.45, bassFreq: 130.81 }, // C5 + C3 cadence
      ];
    } else if (time === 'siang') {
      // SIANG: Sunny, playful discovery theme (F / C Major bouncy kalimba)
      stepIntervalMs = 460;
      melodyNotes = [
        { freq: 698.46, dur: 0.28, bassFreq: 174.61 }, // F5 + F3
        { freq: 880.00, dur: 0.26 },                   // A5
        { freq: 1046.50, dur: 0.32 },                  // C6
        { freq: 880.00, dur: 0.24 },                   // A5
        { freq: 783.99, dur: 0.28, bassFreq: 196.00 }, // G5 + G3
        { freq: 987.77, dur: 0.26 },                   // B5
        { freq: 1174.66, dur: 0.34 },                  // D6
        { freq: 1046.50, dur: 0.26 },                  // C6
        { freq: 880.00, dur: 0.28, bassFreq: 220.00 }, // A5 + A3
        { freq: 698.46, dur: 0.26 },                   // F5
        { freq: 783.99, dur: 0.28 },                   // G5
        { freq: 659.25, dur: 0.32, bassFreq: 130.81 }, // E5 + C3
        { freq: 587.33, dur: 0.26 },                   // D5
        { freq: 523.25, dur: 0.28 },                   // C5
        { freq: 587.33, dur: 0.28 },                   // D5
        { freq: 523.25, dur: 0.48, bassFreq: 130.81 }, // C5
      ];
    } else {
      // MALAM: Relaxing, peaceful bedtime lullaby music-box (gentle & serene celesta)
      stepIntervalMs = 580;
      melodyNotes = [
        { freq: 523.25, dur: 0.42, bassFreq: 130.81 }, // C5 + C3
        { freq: 659.25, dur: 0.38 },                   // E5
        { freq: 783.99, dur: 0.42 },                   // G5
        { freq: 987.77, dur: 0.38, bassFreq: 164.81 }, // B5 + E3
        { freq: 880.00, dur: 0.42 },                   // A5
        { freq: 783.99, dur: 0.38 },                   // G5
        { freq: 659.25, dur: 0.42, bassFreq: 174.61 }, // E5 + F3
        { freq: 587.33, dur: 0.38 },                   // D5
        { freq: 523.25, dur: 0.42, bassFreq: 130.81 }, // C5 + C3
        { freq: 659.25, dur: 0.38 },                   // E5
        { freq: 783.99, dur: 0.42 },                   // G5
        { freq: 1046.50, dur: 0.46, bassFreq: 196.00 },// C6 + G3
        { freq: 880.00, dur: 0.38 },                   // A5
        { freq: 783.99, dur: 0.38 },                   // G5
        { freq: 659.25, dur: 0.40 },                   // E5
        { freq: 523.25, dur: 0.65, bassFreq: 130.81 }, // C5
      ];
    }

    const playNextMusicStep = () => {
      if (!this.ctx || this.isMuted) return;
      const ctx = this.ctx;
      const note = melodyNotes[this.musicStepIndex];
      const start = ctx.currentTime;

      // 1. Primary Marimba / Glockenspiel Bell Voice
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sine fundamental + soft harmonic overtone
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, start);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.freq * 2.0, start); // 1 octave overtone for wooden marimba resonance

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(time === 'malam' ? 1100 : 1800, start);

      // Soft, gentle level: "lirih saja" (approx 0.12 - 0.16)
      const noteVol = time === 'malam' ? 0.11 : 0.15;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(noteVol, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(targetGain);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + note.dur);
      osc2.stop(start + note.dur);

      // 2. Gentle Pizzicato Bass on Downbeats
      if (note.bassFreq) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(note.bassFreq, start);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(260, start);

        const bassVol = 0.13;
        bassGain.gain.setValueAtTime(0.0001, start);
        bassGain.gain.linearRampToValueAtTime(bassVol, start + 0.012);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur * 1.5);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(targetGain);

        bassOsc.start(start);
        bassOsc.stop(start + note.dur * 1.5);
      }

      // Advance sequence step
      this.musicStepIndex = (this.musicStepIndex + 1) % melodyNotes.length;

      // Schedule next note in continuous loop
      const nextTimer = window.setTimeout(playNextMusicStep, stepIntervalMs);
      this.periodicTimers.push(nextTimer);
    };

    const firstTimer = window.setTimeout(playNextMusicStep, 150);
    this.periodicTimers.push(firstTimer);
  }

  // =========================================================================
  // NATURAL AMBIENT SOUND GENERATORS (FILTERED ORGANIC NOISE & BIRDS)
  // =========================================================================

  private createSoftBreeze(cutoffFreq: number, gainLevel: number, targetGain: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.09;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffFreq, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(targetGain);
    source.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // Ignored
        }
      },
    });
  }

  // Sweet natural birdsong (melodious sinusoidal chirps)
  private scheduleGentleBirdsong(targetGain: GainNode) {
    const playChirp = () => {
      if (!this.ctx || this.isMuted) return;
      const ctx = this.ctx;

      const numNotes = Math.floor(Math.random() * 2) + 2;
      const baseFreq = 2200 + Math.random() * 600;

      for (let i = 0; i < numNotes; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.12;
        const dur = 0.085;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, start);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, start + dur * 0.4);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, start + dur);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.024, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(targetGain);

        osc.start(start);
        osc.stop(start + dur);
      }

      const nextDelay = 4000 + Math.random() * 5000;
      const timer = window.setTimeout(playChirp, nextDelay);
      this.periodicTimers.push(timer);
    };

    const initial = window.setTimeout(playChirp, 1500);
    this.periodicTimers.push(initial);
  }

  // Ultra-soft natural crickets for night
  private scheduleSoftNightCrickets(targetGain: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const tremolo = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    const cricketGain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(3900, ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4050, ctx.currentTime);

    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(3.0, ctx.currentTime);

    tremoloGain.gain.setValueAtTime(0.005, ctx.currentTime);
    cricketGain.gain.setValueAtTime(0.008, ctx.currentTime);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(3980, ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, ctx.currentTime);

    tremolo.connect(tremoloGain);
    tremoloGain.connect(cricketGain.gain);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(cricketGain);
    cricketGain.connect(targetGain);

    tremolo.start();
    osc1.start();
    osc2.start();

    this.activeNodes.push({
      stop: () => {
        try {
          tremolo.stop();
          osc1.stop();
          osc2.stop();
          tremolo.disconnect();
          osc1.disconnect();
          osc2.disconnect();
        } catch {
          // Ignored
        }
      },
    });
  }

  // =========================================================================
  // ROOM SPECIFIC SOUNDSCAPES
  // =========================================================================

  private playHouseAmbience(time: TimeOfDay, targetGain: GainNode) {
    if (time === 'pagi') {
      this.createSoftBreeze(350, 0.015, targetGain);
      this.scheduleGentleBirdsong(targetGain);
    } else if (time === 'siang') {
      this.createSoftBreeze(480, 0.018, targetGain);
    } else {
      this.createSoftBreeze(200, 0.012, targetGain);
      this.scheduleSoftNightCrickets(targetGain);
    }
  }

  private playGardenAmbience(time: TimeOfDay, targetGain: GainNode) {
    if (time === 'malam') {
      this.createSoftBreeze(220, 0.014, targetGain);
      this.scheduleSoftNightCrickets(targetGain);
    } else if (time === 'siang') {
      this.createSoftBreeze(500, 0.022, targetGain);
      this.scheduleGentleBirdsong(targetGain);
    } else {
      this.createSoftBreeze(400, 0.020, targetGain);
      this.scheduleGentleBirdsong(targetGain);
    }
  }

  private playKitchenAmbience(_time: TimeOfDay, targetGain: GainNode) {
    this.createSoftBreeze(280, 0.016, targetGain);
  }

  private playBathroomAmbience(targetGain: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.createSoftBreeze(500, 0.018, targetGain);

    const scheduleDrop = () => {
      if (!this.ctx || this.isMuted || this.currentRoom !== 'kamar-mandi') return;
      const osc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      const start = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, start);
      osc.frequency.exponentialRampToValueAtTime(440, start + 0.07);

      dropGain.gain.setValueAtTime(0.016, start);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);

      osc.connect(dropGain);
      dropGain.connect(targetGain);
      osc.start(start);
      osc.stop(start + 0.07);

      const next = window.setTimeout(scheduleDrop, 6500 + Math.random() * 4500);
      this.periodicTimers.push(next);
    };

    const timer = window.setTimeout(scheduleDrop, 2000);
    this.periodicTimers.push(timer);
  }

  private playBedroomAmbience(_time: TimeOfDay, targetGain: GainNode) {
    this.createSoftBreeze(220, 0.012, targetGain);
  }

  private playLivingRoomAmbience(_time: TimeOfDay, targetGain: GainNode) {
    this.createSoftBreeze(300, 0.014, targetGain);
  }
}

export const ambientAudio = new AmbientAudioManager();
