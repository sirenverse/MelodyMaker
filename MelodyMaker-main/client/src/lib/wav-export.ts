import type { Note, Chord } from "@shared/schema";
import type { AudioEngine } from "./audio-engine";

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);

  // Convert samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

async function renderAudio(notes: Note[], chords: Chord[], bpm: number, instrument: string): Promise<Float32Array> {
  const sampleRate = 44100;
  const duration = Math.max(
    ...notes.map(n => n.timestamp),
    ...chords.map(c => c.timestamp)
  ) / 1000 + 3; // Add 3 seconds buffer

  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  
  // Helper function to get waveform
  const getWaveform = (instrument: string) => {
    switch (instrument) {
      case 'piano': return (t: number, freq: number) => Math.sin(2 * Math.PI * freq * t);
      case 'guitar': return (t: number, freq: number) => {
        const fundamental = Math.sin(2 * Math.PI * freq * t);
        const harmonic = 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
        return fundamental + harmonic;
      };
      case 'bass': return (t: number, freq: number) => {
        const x = 2 * Math.PI * freq * t;
        return x - Math.floor(x / (2 * Math.PI)) * 2 * Math.PI < Math.PI ? 1 : -1;
      };
      case 'synth': return (t: number, freq: number) => {
        const x = 2 * Math.PI * freq * t;
        return Math.sign(Math.sin(x));
      };
      default: return (t: number, freq: number) => Math.sin(2 * Math.PI * freq * t);
    }
  };

  const waveform = getWaveform(instrument);
  const startTime = Math.min(
    ...notes.map(n => n.timestamp),
    ...chords.map(c => c.timestamp)
  );

  // Render notes
  notes.forEach(note => {
    const startSample = Math.floor(((note.timestamp - startTime) / 1000) * sampleRate);
    const noteDuration = 0.5 * sampleRate; // 0.5 second duration
    
    for (let i = 0; i < noteDuration && startSample + i < samples.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2); // Exponential decay
      const sample = waveform(t, note.frequency) * 0.1 * envelope * (note.velocity || 0.7);
      samples[startSample + i] += sample;
    }
  });

  // Render chords
  chords.forEach(chord => {
    const startSample = Math.floor(((chord.timestamp - startTime) / 1000) * sampleRate);
    const chordDuration = 1.0 * sampleRate; // 1 second duration
    
    chord.notes.forEach(noteName => {
      const frequency = getNoteFrequency(noteName);
      
      for (let i = 0; i < chordDuration && startSample + i < samples.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 1); // Slower decay for chords
        const sample = waveform(t, frequency) * 0.05 * envelope; // Lower volume per note in chord
        samples[startSample + i] += sample;
      }
    });
  });

  // Normalize audio to prevent clipping
  let maxSample = 0;
  for (let i = 0; i < samples.length; i++) {
    maxSample = Math.max(maxSample, Math.abs(samples[i]));
  }
  
  if (maxSample > 1.0) {
    for (let i = 0; i < samples.length; i++) {
      samples[i] /= maxSample;
    }
  }

  return samples;
}

function getNoteFrequency(note: string): number {
  const noteFrequencies: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };
  
  return noteFrequencies[note] || 440.00;
}

export async function exportWAV(
  notes: Note[], 
  chords: Chord[], 
  bpm: number, 
  instrument: string,
  audioEngine: AudioEngine
): Promise<void> {
  try {
    const sampleRate = 44100;
    const samples = await renderAudio(notes, chords, bpm, instrument);
    const wavBuffer = encodeWAV(samples, sampleRate);
    
    // Download the file
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chordcraft-sequence-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('WAV export failed:', error);
    throw error;
  }
}
