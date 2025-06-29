export function getScaleNotes(key: string, scale: string): string[] {
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyIndex = chromatic.indexOf(key);

  if (keyIndex === -1) return [];

  const scalePatterns: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
  };

  const pattern = scalePatterns[scale] || scalePatterns.major;

  return pattern.map(interval => {
    const noteIndex = (keyIndex + interval) % 12;
    return chromatic[noteIndex];
  });
}

// Get essential chords optimized for Salamander Grand Piano samples
export function getChordsForScale(
  key: string, 
  scale: string, 
  salamanderPiano?: any
): Array<{ name: string; notes: string[] }> {
  const scaleNotes = getScaleNotes(key, scale);
  const chords: Array<{ name: string; notes: string[] }> = [];

  if (scale === 'major') {
    // Essential piano chords - focused collection for great sound

    // Basic triads (7 chords) - Core of piano playing
    const triadTypes = ['', 'm', 'm', '', '', 'm', 'dim'];
    for (let i = 0; i < 7; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % 7];
      const fifth = scaleNotes[(i + 4) % 7];
      chords.push({
        name: root + triadTypes[i],
        notes: [root, third, fifth]
      });
    }

    // Essential seventh chords (5 most important)
    const essentialSevenths = [
      { name: scaleNotes[0] + 'maj7', notes: [scaleNotes[0], scaleNotes[2], scaleNotes[4], scaleNotes[6]] }, // Imaj7
      { name: scaleNotes[1] + 'm7', notes: [scaleNotes[1], scaleNotes[3], scaleNotes[5], scaleNotes[0]] },   // ii7
      { name: scaleNotes[3] + 'maj7', notes: [scaleNotes[3], scaleNotes[5], scaleNotes[0], scaleNotes[2]] }, // IVmaj7
      { name: scaleNotes[4] + '7', notes: [scaleNotes[4], scaleNotes[6], scaleNotes[1], scaleNotes[3]] },    // V7
      { name: scaleNotes[5] + 'm7', notes: [scaleNotes[5], scaleNotes[0], scaleNotes[2], scaleNotes[4]] }    // vi7
    ];
    chords.push(...essentialSevenths);

    // Popular suspended chords (3 most useful)
    const popularSus = [
      { name: scaleNotes[0] + 'sus2', notes: [scaleNotes[0], scaleNotes[1], scaleNotes[4]] },
      { name: scaleNotes[0] + 'sus4', notes: [scaleNotes[0], scaleNotes[3], scaleNotes[4]] },
      { name: scaleNotes[4] + 'sus4', notes: [scaleNotes[4], scaleNotes[0], scaleNotes[1]] }
    ];
    chords.push(...popularSus);

  } else if (scale === 'minor') {
    // Natural minor scale chords
    const triadTypes = ['m', 'dim', '', 'm', 'm', '', ''];
    const seventhTypes = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];

    // Add triads
    for (let i = 0; i < 7; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % 7];
      const fifth = scaleNotes[(i + 4) % 7];
      chords.push({
        name: root + triadTypes[i],
        notes: [root, third, fifth]
      });
    }

    // Add 7th chords
    for (let i = 0; i < 7; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % 7];
      const fifth = scaleNotes[(i + 4) % 7];
      const seventh = scaleNotes[(i + 6) % 7];

      chords.push({
        name: root + seventhTypes[i],
        notes: [root, third, fifth, seventh]
      });
    }

  } else if (scale === 'pentatonic') {
    // Pentatonic scale chords (power chords and simple triads)
    for (let i = 0; i < scaleNotes.length; i++) {
      const root = scaleNotes[i];
      const fifth = scaleNotes[(i + 2) % scaleNotes.length];

      // Power chord (root + fifth)
      chords.push({
        name: root + '5',
        notes: [root, fifth]
      });

      // Add suspended chords using pentatonic intervals
      if (i + 3 < scaleNotes.length) {
        const fourth = scaleNotes[(i + 3) % scaleNotes.length];
        chords.push({
          name: root + 'sus4',
          notes: [root, fourth, fifth]
        });
      }
    }

  } else if (scale === 'blues') {
    // Blues scale chords - emphasis on dominant 7ths and power chords
    for (let i = 0; i < scaleNotes.length; i++) {
      const root = scaleNotes[i];

      // Power chords
      if (i + 2 < scaleNotes.length) {
        const fifth = scaleNotes[(i + 2) % scaleNotes.length];
        chords.push({
          name: root + '5',
          notes: [root, fifth]
        });
      }

      // Dominant 7th chords (blues characteristic)
      if (i + 4 < scaleNotes.length) {
        const third = scaleNotes[(i + 1) % scaleNotes.length];
        const fifth = scaleNotes[(i + 2) % scaleNotes.length];
        const seventh = scaleNotes[(i + 4) % scaleNotes.length];
        chords.push({
          name: root + '7',
          notes: [root, third, fifth, seventh]
        });
      }
    }

  } else if (scale === 'dorian') {
    // Dorian mode chords
    const triadTypes = ['m', 'm', '', '', 'm', 'dim', ''];
    const seventhTypes = ['m7', 'm7', 'maj7', '7', 'm7', 'm7b5', 'maj7'];

    // Add triads and 7ths
    for (let i = 0; i < 7; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % 7];
      const fifth = scaleNotes[(i + 4) % 7];
      const seventh = scaleNotes[(i + 6) % 7];

      // Triad
      chords.push({
        name: root + triadTypes[i],
        notes: [root, third, fifth]
      });

      // 7th chord
      chords.push({
        name: root + seventhTypes[i],
        notes: [root, third, fifth, seventh]
      });
    }

  } else if (scale === 'mixolydian') {
    // Mixolydian mode chords
    const triadTypes = ['', 'm', 'dim', '', 'm', 'm', ''];
    const seventhTypes = ['7', 'm7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7'];

    // Add triads and 7ths
    for (let i = 0; i < 7; i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % 7];
      const fifth = scaleNotes[(i + 4) % 7];
      const seventh = scaleNotes[(i + 6) % 7];

      // Triad
      chords.push({
        name: root + triadTypes[i],
        notes: [root, third, fifth]
      });

      // 7th chord
      chords.push({
        name: root + seventhTypes[i],
        notes: [root, third, fifth, seventh]
      });
    }

  } else {
    // Default: create simple triads from scale degrees
    for (let i = 0; i < Math.min(scaleNotes.length, 7); i++) {
      const root = scaleNotes[i];
      const third = scaleNotes[(i + 2) % scaleNotes.length];
      const fifth = scaleNotes[(i + 4) % scaleNotes.length];
      chords.push({
        name: root,
        notes: [root, third, fifth]
      });
    }
  }

  return chords;
}

export function getChordNotes(chordName: string): string[] {
  const chordPatterns: Record<string, string[]> = {
    'C': ['C', 'E', 'G'],
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
    'F': ['F', 'A', 'C'],
    'G': ['G', 'B', 'D'],
    'Am': ['A', 'C', 'E'],
    'Bdim': ['B', 'D', 'F'],
    'C7': ['C', 'E', 'G', 'B'],
    'Fmaj7': ['F', 'A', 'C', 'E'],
  };

  return chordPatterns[chordName] || [];
}

export function transposeChord(chordName: string, semitones: number): string {
  // This would implement chord transposition logic
  // For now, return the original chord name
  return chordName;
}

export function getNoteFrequency(note: string, octave = 4): number {
  const noteFrequencies: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  const baseFreq = noteFrequencies[note] || 440.00;
  return baseFreq * Math.pow(2, octave - 4);
}