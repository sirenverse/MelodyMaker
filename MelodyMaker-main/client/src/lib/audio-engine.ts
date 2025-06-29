import type { Note, Chord } from "@shared/schema";

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.8;
    }
  }

  playNote(frequency: number, instrument: string, duration = 0.5) {
    if (!this.audioContext || !this.masterGain) return;

    // Use enhanced synthesis for all instruments
    this.createRealisticInstrument(frequency, instrument, duration);
  }

  private frequencyToNote(frequency: number): { note: string, octave: number } {
    // Convert frequency to note and octave
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    if (frequency > C0) {
      const h = Math.round(12 * Math.log2(frequency / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return { note: notes[n], octave };
    }
    
    return { note: 'C', octave: 4 }; // Default fallback
  }

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

  private createEnhancedPianoSound(frequency: number, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    // Ultra-realistic Grand Piano Sound with advanced synthesis
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Main fundamental frequency with slight detuning for realism
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    
    // Harmonic series for realistic piano timbre
    const osc2 = this.audioContext.createOscillator(); // 2nd harmonic
    const gain2 = this.audioContext.createGain();
    
    const osc3 = this.audioContext.createOscillator(); // 3rd harmonic
    const gain3 = this.audioContext.createGain();
    
    const osc4 = this.audioContext.createOscillator(); // 5th harmonic
    const gain4 = this.audioContext.createGain();

    const osc5 = this.audioContext.createOscillator(); // 7th harmonic for brightness
    const gain5 = this.audioContext.createGain();

    // Resonance oscillator for piano body resonance
    const resonanceOsc = this.audioContext.createOscillator();
    const resonanceGain = this.audioContext.createGain();

    // String resonance oscillator
    const stringOsc = this.audioContext.createOscillator();
    const stringGain = this.audioContext.createGain();

    // Piano body filter - models acoustic piano resonance
    const bodyFilter = this.audioContext.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.value = frequency * 0.8;
    bodyFilter.Q.value = 2.5;
    bodyFilter.gain.value = 4;

    // Brightness filter with frequency-dependent cutoff
    const brightnessFilter = this.audioContext.createBiquadFilter();
    brightnessFilter.type = 'lowpass';
    brightnessFilter.frequency.value = frequency < 200 ? 3000 : frequency < 500 ? 5000 : 8000;
    brightnessFilter.Q.value = 0.8;

    // Warmth filter for lower frequencies
    const warmthFilter = this.audioContext.createBiquadFilter();
    warmthFilter.type = 'highpass';
    warmthFilter.frequency.value = frequency * 0.1;
    warmthFilter.Q.value = 0.5;

    // Connect the audio graph
    oscillators.push(osc1, osc2, osc3, osc4, osc5, resonanceOsc, stringOsc);
    gains.push(gain1, gain2, gain3, gain4, gain5, resonanceGain, stringGain);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    osc4.connect(gain4);
    osc5.connect(gain5);
    resonanceOsc.connect(resonanceGain);
    stringOsc.connect(stringGain);
    
    gain1.connect(warmthFilter);
    gain2.connect(warmthFilter);
    gain3.connect(warmthFilter);
    gain4.connect(bodyFilter);
    gain5.connect(bodyFilter);
    resonanceGain.connect(bodyFilter);
    stringGain.connect(warmthFilter);
    
    warmthFilter.connect(bodyFilter);
    bodyFilter.connect(brightnessFilter);
    brightnessFilter.connect(this.masterGain);

    // Set frequencies and waveforms with realistic detuning
    osc1.frequency.value = frequency * 0.9995; // Slight detuning for realism
    osc1.type = 'triangle';
    
    osc2.frequency.value = frequency * 2.003; // Slightly detuned 2nd harmonic
    osc2.type = 'sine';
    
    osc3.frequency.value = frequency * 3.007; // Slightly detuned 3rd harmonic
    osc3.type = 'sine';
    
    osc4.frequency.value = frequency * 5.002; // 5th harmonic for brightness
    osc4.type = 'sine';
    
    osc5.frequency.value = frequency * 7.001; // 7th harmonic for sparkle
    osc5.type = 'sine';
    
    resonanceOsc.frequency.value = frequency * 0.5; // Sub-harmonic for body resonance
    resonanceOsc.type = 'triangle';

    stringOsc.frequency.value = frequency * 1.001; // String resonance
    stringOsc.type = 'sawtooth';

    // Ultra-realistic grand piano envelope characteristics
    const startTime = this.audioContext.currentTime;
    const attackTime = 0.003; // Lightning-fast attack like a real piano hammer
    const decayTime = duration * 0.25; // Natural decay
    const sustainLevel = 0.3;
    
    // Main fundamental - strongest component
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(0.7, startTime + attackTime);
    gain1.gain.exponentialRampToValueAtTime(sustainLevel, startTime + decayTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    // 2nd harmonic - adds richness
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(0.35, startTime + attackTime);
    gain2.gain.exponentialRampToValueAtTime(0.15, startTime + decayTime);
    gain2.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

    // 3rd harmonic - adds warmth and body
    gain3.gain.setValueAtTime(0, startTime);
    gain3.gain.linearRampToValueAtTime(0.25, startTime + attackTime);
    gain3.gain.exponentialRampToValueAtTime(0.08, startTime + decayTime);
    gain3.gain.exponentialRampToValueAtTime(0.003, startTime + duration);

    // 5th harmonic - adds brightness and clarity
    gain4.gain.setValueAtTime(0, startTime);
    gain4.gain.linearRampToValueAtTime(0.15, startTime + attackTime);
    gain4.gain.exponentialRampToValueAtTime(0.04, startTime + decayTime * 0.6);
    gain4.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // 7th harmonic - adds sparkle (especially for higher notes)
    const sparkleAmount = frequency > 400 ? 0.08 : 0.04;
    gain5.gain.setValueAtTime(0, startTime);
    gain5.gain.linearRampToValueAtTime(sparkleAmount, startTime + attackTime);
    gain5.gain.exponentialRampToValueAtTime(0.01, startTime + decayTime * 0.4);
    gain5.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

    // Resonance - piano body sound
    resonanceGain.gain.setValueAtTime(0, startTime);
    resonanceGain.gain.linearRampToValueAtTime(0.12, startTime + attackTime * 2);
    resonanceGain.gain.exponentialRampToValueAtTime(0.03, startTime + duration);

    // String resonance - adds metallic character
    stringGain.gain.setValueAtTime(0, startTime);
    stringGain.gain.linearRampToValueAtTime(0.06, startTime + attackTime);
    stringGain.gain.exponentialRampToValueAtTime(0.01, startTime + decayTime * 0.3);
    stringGain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

    // Start and manage all oscillators
    oscillators.forEach(osc => {
      this.activeOscillators.add(osc);
      osc.start(startTime);
      osc.stop(startTime + duration);
      osc.onended = () => this.activeOscillators.delete(osc);
    });
  }

  private createGuitarSound(frequency: number, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Guitar-like filtering
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency * 2;
    filter.Q.value = 2;

    // Add some distortion characteristic of guitar
    const waveshaper = this.audioContext.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i - 128) / 128;
      curve[i] = Math.tanh(x * 2) * 0.7;
    }
    waveshaper.curve = curve;

    osc.connect(waveshaper);
    waveshaper.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.value = frequency;
    osc.type = 'sawtooth';

    const startTime = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    this.activeOscillators.add(osc);
    osc.start(startTime);
    osc.stop(startTime + duration);
    osc.onended = () => this.activeOscillators.delete(osc);
  }

  private createBassSound(frequency: number, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Low-pass filter for bass warmth
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 4;
    filter.Q.value = 1.5;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.value = frequency;
    osc.type = 'triangle';

    const startTime = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    this.activeOscillators.add(osc);
    osc.start(startTime);
    osc.stop(startTime + duration);
    osc.onended = () => this.activeOscillators.delete(osc);
  }

  private createSynthSound(frequency: number, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Synth filter sweep
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 2;
    filter.Q.value = 5;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.frequency.value = frequency;
    osc2.frequency.value = frequency * 1.01; // Slight detune for width

    osc1.type = 'square';
    osc2.type = 'sawtooth';

    const startTime = this.audioContext.currentTime;
    
    // Filter sweep
    filter.frequency.setValueAtTime(frequency * 8, startTime);
    filter.frequency.exponentialRampToValueAtTime(frequency * 2, startTime + duration * 0.3);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    [osc1, osc2].forEach(osc => {
      this.activeOscillators.add(osc);
      osc.start(startTime);
      osc.stop(startTime + duration);
      osc.onended = () => this.activeOscillators.delete(osc);
    });
  }

  playChord(chord: Chord, instrument: string, duration = 1.0) {
    // Use synthesized chords for all instruments
    const noteFrequencies = this.getChordFrequencies(chord.notes);
    noteFrequencies.forEach(frequency => {
      this.playNote(frequency, instrument, duration);
    });
  }

  async playSequence(notes: Note[], chords: Chord[], bpm: number, instrument: string) {
    const beatDuration = 60 / bpm;
    
    // Sort all events by timestamp
    const events = [
      ...notes.map(note => ({ type: 'note' as const, ...note })),
      ...chords.map(chord => ({ type: 'chord' as const, ...chord }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    if (events.length === 0) return;

    const startTime = events[0].timestamp;
    
    for (const event of events) {
      const delay = (event.timestamp - startTime) / 1000; // Convert to seconds
      
      setTimeout(() => {
        if (event.type === 'note') {
          this.playNote(event.frequency, instrument);
        } else {
          this.playChord(event, instrument);
        }
      }, delay * 1000);
    }
  }

  async playChordProgression(chords: Chord[], bpm: number, instrument: string) {
    const beatDuration = (60 / bpm) * 1000; // Convert to milliseconds
    
    for (let i = 0; i < chords.length; i++) {
      setTimeout(() => {
        this.playChord(chords[i], instrument);
      }, i * beatDuration);
    }
  }

  playScale(scaleNotes: string[], instrument: string) {
    // Use synthesized scales for all instruments
    const noteFrequencies = scaleNotes.map(note => this.getNoteFrequency(note));
    
    noteFrequencies.forEach((frequency, index) => {
      setTimeout(() => {
        this.playNote(frequency, instrument, 0.3);
      }, index * 200);
    });
  }

  stopAll() {
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();
  }

  private getWaveform(instrument: string): OscillatorType {
    switch (instrument) {
      case 'piano': return 'triangle';
      case 'guitar': return 'sawtooth';
      case 'bass': return 'sine';
      case 'synth': return 'square';
      default: return 'triangle';
    }
  }

  private getChordFrequencies(notes: string[]): number[] {
    return notes.map(note => this.getNoteFrequency(note));
  }

  private getNoteFrequency(note: string): number {
    const noteFrequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    
    return noteFrequencies[note] || 440.00;
  }

  // Record audio for WAV export
  async recordSequence(notes: Note[], chords: Chord[], bpm: number, instrument: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const duration = Math.max(
      ...notes.map(n => n.timestamp),
      ...chords.map(c => c.timestamp)
    ) / 1000 + 2; // Add 2 seconds buffer

    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    // This is a simplified implementation - in production you'd want more sophisticated audio rendering
    const startTime = Math.min(...notes.map(n => n.timestamp), ...chords.map(c => c.timestamp));
    
    notes.forEach(note => {
      const startSample = Math.floor(((note.timestamp - startTime) / 1000) * sampleRate);
      const noteDuration = 0.5 * sampleRate;
      
      for (let i = 0; i < noteDuration && startSample + i < length; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * note.frequency * t) * 0.1 * Math.exp(-t * 2);
        channelData[startSample + i] += sample;
      }
    });

    return buffer;
  }

  // Cleanup method
  dispose() {
    this.stopAll();
  }
}