
// Salamander Grand Piano sample loader and player
export class SalamanderPiano {
  private audioContext: AudioContext | null = null;
  private samples: Map<string, AudioBuffer> = new Map();
  private baseUrl: string;
  private isLoaded = false;

  constructor(baseUrl = '/audio/salamander') {
    this.baseUrl = baseUrl;
  }

  // Test if sample directory is accessible
  private async testSampleAccess(): Promise<boolean> {
    try {
      // Test with a common sample that should exist
      const testUrl = `${this.baseUrl}/A4v8.flac`;
      const response = await fetch(testUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async initialize(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    console.log('🎹 Initializing Salamander Piano...');
    console.log(`Sample directory: ${this.baseUrl}`);
    
    // Load essential samples for chord building - optimized selection
    const essentialNotes = [
      'A0', 'C1', 'E1', 'A1', 'C2', 'E2', 'A2', 'C3', 'E3', 'A3',
      'C4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 
      'B5', 'C6', 'E6', 'A6', 'C7'
    ];

    try {
      // First test if sample directory is accessible
      const canAccess = await this.testSampleAccess();
      if (!canAccess) {
        console.warn('⚠️ Cannot access sample directory. Sample files may be missing.');
        console.warn(`Expected location: ${this.baseUrl}/`);
        console.warn('Please ensure FLAC sample files are placed in the public/audio/salamander/ directory.');
      }
      
      await this.loadSamples(essentialNotes);
      
      if (this.samples.size > 0) {
        this.isLoaded = true;
        console.log(`✅ Salamander Piano initialized successfully: ${this.samples.size} samples available`);
      } else {
        this.isLoaded = false;
        console.warn('⚠️ Salamander Piano: No samples could be loaded. Check if sample files exist in /public/audio/salamander/');
        console.warn('📁 Expected files: A0v8.flac, C1v8.flac, E1v8.flac, etc.');
        console.warn('🔄 Falling back to synthesized piano sounds.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Salamander Piano:', error);
      this.isLoaded = false;
    }
  }

  private async loadSamples(notes: string[]) {
    const loadPromises = notes.map(async (note) => {
      try {
        // Try different velocity layers, prefer v8 (medium velocity)
        const velocities = ['v8', 'v7', 'v9', 'v6', 'v10', 'v5', 'v11', 'v4', 'v12'];
        
        for (const velocity of velocities) {
          try {
            const url = `${this.baseUrl}/${note}${velocity}.flac`;
            console.log(`Attempting to load: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
              console.log(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
              continue;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Check if we actually got data
            if (arrayBuffer.byteLength === 0) {
              console.log(`Empty file: ${url}`);
              continue;
            }
            
            try {
              const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
              this.samples.set(note, audioBuffer);
              console.log(`✓ Successfully loaded sample: ${note}${velocity}.flac (${audioBuffer.duration.toFixed(2)}s)`);
              break; // Successfully loaded, stop trying other velocities
            } catch (decodeError) {
              console.log(`Failed to decode audio for ${url}:`, decodeError);
              continue;
            }
          } catch (fetchError) {
            console.log(`Network error loading ${note}${velocity}.flac:`, fetchError);
            continue; // Try next velocity
          }
        }
        
        if (!this.samples.has(note)) {
          console.warn(`⚠️ Could not load any sample for ${note} - all velocities failed`);
        }
      } catch (error) {
        console.error(`Unexpected error loading samples for ${note}:`, error);
      }
    });

    const results = await Promise.allSettled(loadPromises);
    console.log(`Sample loading complete. Loaded ${this.samples.size} out of ${notes.length} requested samples.`);
    
    // Log which samples we have
    if (this.samples.size > 0) {
      console.log('Available samples:', Array.from(this.samples.keys()).sort());
    }
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

    // Apply velocity and realistic piano envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.9, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(velocity * 0.4, this.audioContext.currentTime + 0.3);
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
    return this.isLoaded && this.samples.size > 0;
  }

  getSampleCount(): number {
    return this.samples.size;
  }
}
