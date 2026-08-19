/**
 * Web Audio API synthesizer that generates Tempo tones and timer alarms:
 * - Golden Hour: Mellow, resonant multi-note pentatonic chime
 * - Aura Ping: Short mid-high ping with shimmering overtone
 * - Crystal Fizz: Bright crisp sparkle arpeggio
 * - Velvet Pop: Soft low harmonic bubble pop
 * - Cloud Drift: Mellow ambient chord swell
 * - Alarm Ring: Continuous ringing alarm loop for timer completion splash screen
 */

export type SoundName = 'Golden Hour' | 'Aura Ping' | 'Crystal Fizz' | 'Velvet Pop' | 'Cloud Drift' | 'Alarm Ring';

let audioCtx: AudioContext | null = null;
let activeAlarmInterval: NodeJS.Timeout | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function triggerVibration(pattern: number[] = [300, 150, 300, 150, 600]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch (_) {}
}

export function playSound(soundName: SoundName | string = 'Golden Hour', volume = 0.6): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    switch (soundName) {
      case 'Golden Hour': {
        const freqs = [659.25, 830.61, 987.77, 1318.51];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.35, now + i * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 1.3);
        });
        break;
      }

      case 'Aura Ping': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2093.0, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.75);
        osc2.stop(now + 0.75);
        break;
      }

      case 'Crystal Fizz': {
        const notes = [1174.66, 1396.91, 1760.0, 2093.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.5);
        });
        break;
      }

      case 'Velvet Pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case 'Cloud Drift':
      default: {
        const chord = [440, 554.37, 659.25];
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 1.9);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback not permitted or unavailable:', err);
  }
}

export function playCelebrationSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.09);
      gain.gain.setValueAtTime(0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 1.0);
    });
  } catch {
    // silent fail
  }
}

export function startTimerAlarmLoop(soundChoice: SoundName | string = 'Golden Hour'): void {
  stopTimerAlarmLoop();
  
  // Play initial chime and vibration
  playSound(soundChoice, 0.85);
  triggerVibration([400, 200, 400, 200, 800]);

  // Repeat chime every 2.4 seconds while alarm is active
  activeAlarmInterval = setInterval(() => {
    playSound(soundChoice, 0.85);
    triggerVibration([400, 200, 400, 200, 800]);
  }, 2400);
}

export function stopTimerAlarmLoop(): void {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
}
