// Web Audio API offline sound synthesizer for Adzan & Prayer alerts
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play pleasant Adzan / Takbir melodic chord sequence
  playAdzanMelody() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Melody notes representing Allahu Akbar motif
    // G4, C5, D5, Eb5, D5, C5
    const notes = [
      { freq: 392.00, time: 0.0, dur: 0.9 },   // G4
      { freq: 523.25, time: 1.0, dur: 1.4 },   // C5
      { freq: 587.33, time: 2.5, dur: 0.8 },   // D5
      { freq: 622.25, time: 3.4, dur: 1.5 },   // Eb5
      { freq: 587.33, time: 5.0, dur: 1.2 },   // D5
      { freq: 523.25, time: 6.3, dur: 2.5 }    // C5
    ];

    notes.forEach(({ freq, time, dur }) => {
      // Harmonic partials for rich bell/flute tone
      [1, 2, 3].forEach((harmonic, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * harmonic, now + time);

        const volume = (0.25 / harmonic) * (idx === 0 ? 1 : 0.4);
        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.exponentialRampToValueAtTime(volume, now + time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.1);
      });
    });
  }

  // Play pleasant triple chime
  playBeep() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const pitches = [523.25, 659.25, 783.99]; // C5, E5, G5

    pitches.forEach((freq, idx) => {
      const startTime = now + idx * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // Play gentle bell sound
  playGentleBell() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  play(soundType: 'adzan' | 'beep' | 'gentle' | 'silent') {
    if (soundType === 'silent') return;
    try {
      if (soundType === 'adzan') {
        this.playAdzanMelody();
      } else if (soundType === 'beep') {
        this.playBeep();
      } else if (soundType === 'gentle') {
        this.playGentleBell();
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

export const soundSynth = new SoundSynthesizer();

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function showPrayerNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'prayer-reminder'
      });
    } catch {
      // Fallback
    }
  }
}

export const showSystemNotification = showPrayerNotification;
