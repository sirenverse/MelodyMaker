// Salamander Grand Piano sample loader and player
export class SalamanderPiano {
  private audioContext: AudioContext | null = null;
  private samples: Map<string, AudioBuffer> = new Map();
  private baseUrl: string;
  private isLoaded = false;

  constructor(baseUrl = '/audio/salamander') {
    this.baseUrl = baseUrl;
  }

  async initialize(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Load essential samples for common notes
    const essentialNotes = [
      'A0', 'C1', 'E1', 'A1', 'C2', 'E2', 'A2', 'C3', 'E3', 'A3',
      'C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6', 'C7'
    ];

    try {
      await this.loadSamples(essentialNotes);
      this.isLoaded = true;
      console.log('Salamander Piano samples loaded successfully');
    } catch (error) {
      console.warn('Failed to load Salamander samples, falling back to synthesis:', error);
      this.isLoaded = false;
    }
  }

  private async loadSamples(notes: string[]) {
    const loadPromises = notes.map(async (note) => {
      try {
        // Try different velocity layers (v1-v16)
        const velocity = 'v8'; // Medium velocity
        const url = `${this.baseUrl}/${note}${velocity}.wav`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.samples.set(note, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sample for ${note}:`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  playNote(note: string, velocity = 0.7, duration = 2.0) {
    if (!this.audioContext || !this.isLoaded) {
      return false; // Fallback to synthesis
    }

    // Find the closest available sample
    const sample = this.findClosestSample(note);
    if (!sample) return false;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = sample.buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Apply pitch shifting if needed
    if (sample.pitchShift !== 1.0) {
      source.playbackRate.value = sample.pitchShift;
    }

    // Apply velocity and envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.8, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(velocity * 0.3, this.audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    source.start();
    source.stop(this.audioContext.currentTime + duration);

    return true; // Successfully played sample
  }

  private findClosestSample(targetNote: string): { buffer: AudioBuffer; pitchShift: number } | null {
    // Convert note to MIDI number for comparison
    const targetMidi = this.noteToMidi(targetNote);
    
    let closestNote = '';
    let closestDistance = Infinity;

    for (const [note] of this.samples) {
      const noteMidi = this.noteToMidi(note);
      const distance = Math.abs(targetMidi - noteMidi);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNote = note;
      }
    }

    if (closestNote && closestDistance <= 12) { // Within one octave
      const buffer = this.samples.get(closestNote)!;
      const pitchShift = Math.pow(2, (targetMidi - this.noteToMidi(closestNote)) / 12);
      return { buffer, pitchShift };
    }

    return null;
  }

  private noteToMidi(note: string): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    const match = note.match(/([A-G]#?)(\d+)/);
    if (!match) return 60; // Default to C4

    const noteName = match[1];
    const octave = parseInt(match[2]);

    return (octave + 1) * 12 + (noteMap[noteName] || 0);
  }

  isAvailable(): boolean {
    return this.isLoaded;
  }
}