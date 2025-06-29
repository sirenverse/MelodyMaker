import { useState } from "react";
import type { Note } from "@shared/schema";

interface PianoKeyboardProps {
  onNotePlay: (note: Note) => void;
  octaveShift?: number;
  highlightedNotes?: string[];
}

export function PianoKeyboard({
  onNotePlay,
  octaveShift = 0,
  highlightedNotes = [],
}: PianoKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const whiteKeys = [
    { note: "C1", frequency: 65.41 },
    { note: "D1", frequency: 73.42 },
    { note: "E1", frequency: 82.41 },
    { note: "F1", frequency: 87.31 },
    { note: "G1", frequency: 98.0 },
    { note: "A1", frequency: 110.0 },
    { note: "B1", frequency: 123.47 },
    { note: "C2", frequency: 130.81 },
    { note: "D2", frequency: 146.83 },
    { note: "E2", frequency: 164.81 },
    { note: "F2", frequency: 174.61 },
    { note: "G2", frequency: 196.0 },
    { note: "A2", frequency: 220.0 },
    { note: "B2", frequency: 246.94 },
    { note: "C3", frequency: 261.63 },
    { note: "D3", frequency: 293.66 },
    { note: "E3", frequency: 329.63 },
    { note: "F3", frequency: 349.23 },
    { note: "G3", frequency: 392.0 },
    { note: "A3", frequency: 440.0 },
    { note: "B3", frequency: 493.88 },
    { note: "C4", frequency: 523.25 },
    { note: "D4", frequency: 587.33 },
    { note: "E4", frequency: 659.25 },
    { note: "F4", frequency: 698.46 },
    { note: "G4", frequency: 783.99 },
    { note: "A4", frequency: 880.0 },
    { note: "B4", frequency: 987.77 },
  ];

  const blackKeys = [
    { note: "C#1", frequency: 69.3, position: 21 },
    { note: "D#1", frequency: 77.78, position: 51 },
    { note: "F#1", frequency: 92.5, position: 141 },
    { note: "G#1", frequency: 103.83, position: 171 },
    { note: "A#1", frequency: 116.54, position: 201 },
    { note: "C#2", frequency: 138.59, position: 231 },
    { note: "D#2", frequency: 155.56, position: 261 },
    { note: "F#2", frequency: 185.0, position: 351 },
    { note: "G#2", frequency: 207.65, position: 381 },
    { note: "A#2", frequency: 233.08, position: 411 },
    { note: "C#3", frequency: 277.18, position: 441 },
    { note: "D#3", frequency: 311.13, position: 471 },
    { note: "F#3", frequency: 369.99, position: 561 },
    { note: "G#3", frequency: 415.3, position: 591 },
    { note: "A#3", frequency: 466.16, position: 621 },
    { note: "C#4", frequency: 554.37, position: 651 },
    { note: "D#4", frequency: 622.25, position: 681 },
    { note: "F#4", frequency: 739.99, position: 771 },
    { note: "G#4", frequency: 830.61, position: 801 },
    { note: "A#4", frequency: 932.33, position: 831 },
  ];

  const handleKeyDown = (note: string, frequency: number) => {
    const adjustedFrequency = frequency * Math.pow(2, octaveShift);
    setActiveKeys(prev => new Set(prev).add(note));
    
    // Extract note name without octave for the Note object
    const noteName = note.replace(/[0-9]/g, '');
    
    onNotePlay({
      note: noteName,
      frequency: adjustedFrequency,
      timestamp: Date.now(),
      velocity: 0.7,
    });
  };

  const handleKeyUp = (note: string) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
  };

  return (
    <div className="piano-container rounded-lg mb-6">
      <div className="piano-keyboard relative">
        <div className="flex">
          {whiteKeys.map(({ note, frequency }) => (
            <button
              key={note}
              className={`piano-key white-key ${
                activeKeys.has(note) ? "active" : ""
              } ${highlightedNotes.includes(note) ? "highlighted" : ""}`}
              onMouseDown={() => handleKeyDown(note, frequency)}
              onMouseUp={() => handleKeyUp(note)}
              onMouseLeave={() => handleKeyUp(note)}
            >
              <span className="note-label">
                {note.substring(0, note.length - 1)}
              </span>
            </button>
          ))}
        </div>

        <div className="black-keys absolute top-0 flex">
          {blackKeys.map(({ note, frequency, position }) => (
            <button
              key={note}
              className={`piano-key black-key ${
                activeKeys.has(note) ? "active" : ""
              } ${highlightedNotes.includes(note) ? "highlighted" : ""}`}
              style={{ left: `${position}px` }}
              onMouseDown={() => handleKeyDown(note, frequency)}
              onMouseUp={() => handleKeyUp(note)}
              onMouseLeave={() => handleKeyUp(note)}
            >
              <span className="note-label">
                {note.substring(0, note.length - 1)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}