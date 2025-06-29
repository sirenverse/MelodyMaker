import type { Note, Chord } from "@shared/schema";
import { SalamanderPiano } from "./salamander-piano";

export class EnhancedAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private salamanderPiano: SalamanderPiano | null = null;

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.8;

      // Initialize Salamander Piano
      this.salamanderPiano = new SalamanderPiano();
      await this.salamanderPiano.initialize(this.audioContext);
    }
  }

  playNote(frequency: number, instrument: string, duration = 0.5) {
    if (!this.audioContext || !this.masterGain) return;

    // For piano, try Salamander samples first
    if (instrument === 'piano' && this.salamanderPiano?.isAvailable()) {
      const note = this.frequencyToNote(frequency);
      const success = this.salamanderPiano.playNote(note, 0.7, duration);
      if (success) return; // Successfully played sample
    }

    // Fallback to enhanced synthesis
    this.createRealisticInstrument(frequency, instrument, duration);
  }

  private frequencyToNote(frequency: number): string {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    if (frequency > C0) {
      const h = Math.round(12 * Math.log2(frequency / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return notes[n] + octave;
    }
    
    return 'C4';
  }

  // ... rest of your existing audio engine methods ...
  
  private createRealisticInstrument(frequency: number, instrument: string, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    switch (instrument) {
      case 'piano':
        this.createEnhancedPianoSound(frequency, duration);
        break;
      case 'guitar':
        this.createGuitarSound(frequency, duration);
        break;
      case 'bass':
        this.createBassSound(frequency, duration);
        break;
      case 'synth':
        this.createSynthSound(frequency, duration);
        break;
      default:
        this.createEnhancedPianoSound(frequency, duration);
    }
  }

  // Include all your existing synthesis methods here...
  private createEnhancedPianoSound(frequency: number, duration: number) {
    // Your existing enhanced piano synthesis code
  }

  // ... other methods ...

  getSalamanderStatus(): string {
    if (!this.salamanderPiano) return 'Not initialized';
    return this.salamanderPiano.isAvailable() ? 'Loaded' : 'Synthesis fallback';
  }
}