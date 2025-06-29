import type { Note, Chord } from "@shared/schema";

// MIDI file structure helpers
function writeVarLength(value: number): number[] {
  const bytes: number[] = [];
  let temp = value;
  
  while (temp > 0) {
    bytes.unshift(temp & 0x7F);
    temp >>= 7;
  }
  
  for (let i = 0; i < bytes.length - 1; i++) {
    bytes[i] |= 0x80;
  }
  
  return bytes.length ? bytes : [0];
}

function writeInt32(value: number): number[] {
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF
  ];
}

function writeInt16(value: number): number[] {
  return [
    (value >> 8) & 0xFF,
    value & 0xFF
  ];
}

function noteToMidiNumber(note: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const octave = 4; // Default octave
  return (octave + 1) * 12 + (noteMap[note] || 0);
}

export async function exportMIDI(notes: Note[], chords: Chord[], bpm: number): Promise<void> {
  // Create MIDI header
  const header = [
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    ...writeInt32(6), // Header length
    ...writeInt16(0), // Format type 0
    ...writeInt16(1), // Number of tracks
    ...writeInt16(480) // Ticks per quarter note
  ];

  // Create track events
  const events: number[] = [];
  
  // Set tempo
  const microsecondsPerQuarter = Math.floor(60000000 / bpm);
  events.push(
    ...writeVarLength(0), // Delta time
    0xFF, 0x51, 0x03, // Tempo meta event
    (microsecondsPerQuarter >> 16) & 0xFF,
    (microsecondsPerQuarter >> 8) & 0xFF,
    microsecondsPerQuarter & 0xFF
  );

  // Sort all events by timestamp
  const allEvents = [
    ...notes.map(note => ({ type: 'note' as const, ...note })),
    ...chords.flatMap(chord => 
      chord.notes.map(note => ({
        type: 'note' as const,
        note,
        frequency: 440, // Will be converted to MIDI number
        timestamp: chord.timestamp,
        velocity: 0.7
      }))
    )
  ].sort((a, b) => a.timestamp - b.timestamp);

  let lastTime = 0;

  allEvents.forEach(event => {
    const deltaTime = Math.max(0, event.timestamp - lastTime);
    const deltaTicks = Math.floor((deltaTime / 1000) * (480 * bpm / 60));
    
    const midiNote = noteToMidiNumber(event.note);
    const velocity = Math.floor((event.velocity || 0.7) * 127);
    
    // Note on
    events.push(
      ...writeVarLength(deltaTicks),
      0x90, // Note on, channel 0
      midiNote,
      velocity
    );
    
    // Note off (after 1 beat)
    events.push(
      ...writeVarLength(480), // 1 beat duration
      0x80, // Note off, channel 0
      midiNote,
      0
    );
    
    lastTime = event.timestamp;
  });

  // End of track
  events.push(
    ...writeVarLength(0),
    0xFF, 0x2F, 0x00
  );

  // Create track chunk
  const track = [
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    ...writeInt32(events.length),
    ...events
  ];

  // Combine header and track
  const midiData = new Uint8Array([...header, ...track]);

  // Download the file
  const blob = new Blob([midiData], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chordcraft-sequence-${Date.now()}.mid`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
