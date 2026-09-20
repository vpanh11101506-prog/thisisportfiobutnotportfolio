type Listener = (isPlaying: boolean, elapsedSeconds: number) => void;

class RetroAudioSynth {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private synthTimer: number | null = null;
  private elapsedTimer: number | null = null;
  private elapsedSeconds = 0;
  private synthStep = 0;
  private listeners: Set<Listener> = new Set();

  private readonly NOTES: Record<string, number> = {
    C3: 130.81, E3: 164.81, G3: 196.0, B3: 246.94,
    A2: 110.0, C4: 261.63, E4: 329.63, G4: 392.0,
    F2: 87.31, A3: 220.0, D4: 293.66,
    G2: 98.0, B2: 123.47, D3: 146.83,
    A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  };

  private readonly melodyPattern: Array<{ melody: string | null; chord: string | null; bass: string | null }> = [
    { melody: 'E5', chord: 'C3', bass: 'C3' },
    { melody: 'G4', chord: 'E4', bass: null },
    { melody: 'B4', chord: 'G4', bass: null },
    { melody: 'C5', chord: 'B3', bass: null },
    { melody: 'E5', chord: 'A2', bass: 'A2' },
    { melody: 'C5', chord: 'E4', bass: null },
    { melody: 'B4', chord: 'G4', bass: null },
    { melody: 'A4', chord: 'C4', bass: null },
    { melody: 'D5', chord: 'F2', bass: 'F2' },
    { melody: 'A4', chord: 'C4', bass: null },
    { melody: 'C5', chord: 'E4', bass: null },
    { melody: 'A4', chord: 'A3', bass: null },
    { melody: 'B4', chord: 'G2', bass: 'G2' },
    { melody: 'G4', chord: 'B3', bass: null },
    { melody: 'A4', chord: 'D4', bass: null },
    { melody: 'G4', chord: 'B2', bass: null },
  ];

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.isPlaying, this.elapsedSeconds);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlaying, this.elapsedSeconds));
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, time: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private step() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const stepData = this.melodyPattern[this.synthStep % this.melodyPattern.length];
    const stepDuration = 0.32;

    if (stepData.melody && this.NOTES[stepData.melody]) {
      this.playTone(this.NOTES[stepData.melody], 'square', stepDuration * 0.85, 0.04, now);
    }
    if (stepData.chord && this.NOTES[stepData.chord]) {
      this.playTone(this.NOTES[stepData.chord], 'triangle', stepDuration * 0.9, 0.05, now);
    }
    if (stepData.bass && this.NOTES[stepData.bass]) {
      this.playTone(this.NOTES[stepData.bass], 'triangle', stepDuration * 1.5, 0.08, now);
    }

    this.synthStep++;
  }

  public start() {
    this.initAudio();
    this.isPlaying = true;
    this.step();

    if (this.synthTimer) window.clearInterval(this.synthTimer);
    this.synthTimer = window.setInterval(() => this.step(), 320);

    if (!this.elapsedTimer) {
      this.elapsedTimer = window.setInterval(() => {
        this.elapsedSeconds++;
        this.notify();
      }, 1000);
    }

    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.synthTimer) {
      window.clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.elapsedTimer) {
      window.clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
    this.notify();
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public restart() {
    this.elapsedSeconds = 0;
    this.synthStep = 0;
    if (!this.isPlaying) {
      this.start();
    } else {
      this.notify();
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      elapsedSeconds: this.elapsedSeconds,
    };
  }
}

export const audioSynth = new RetroAudioSynth();
