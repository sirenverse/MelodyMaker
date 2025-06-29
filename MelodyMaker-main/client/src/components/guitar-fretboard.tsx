import { useState } from "react";
import type { Note } from "@shared/schema";

interface GuitarFretboardProps {
  onNotePlay: (note: Note) => void;
}

export function GuitarFretboard({ onNotePlay }: GuitarFretboardProps) {
  const [activeFrets, setActiveFrets] = useState<Set<string>>(new Set());

  const strings = [
    { string: 1, tuning: "E", baseFrequency: 329.63, notes: ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"] },
    { string: 2, tuning: "B", baseFrequency: 246.94, notes: ["B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] },
    { string: 3, tuning: "G", baseFrequency: 196.00, notes: ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"] },
    { string: 4, tuning: "D", baseFrequency: 146.83, notes: ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"] },
    { string: 5, tuning: "A", baseFrequency: 110.00, notes: ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"] },
    { string: 6, tuning: "E", baseFrequency: 82.41, notes: ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"] },
  ];

  const handleFretPress = (stringNum: number, fret: number, note: string, baseFrequency: number) => {
    const fretKey = `${stringNum}-${fret}`;
    const frequency = baseFrequency * Math.pow(2, fret / 12);
    
    setActiveFrets(prev => new Set(prev).add(fretKey));
    setTimeout(() => {
      setActiveFrets(prev => {
        const newSet = new Set(prev);
        newSet.delete(fretKey);
        return newSet;
      });
    }, 300);

    onNotePlay({
      note,
      frequency,
      timestamp: Date.now(),
      velocity: 0.7,
      fret,
      string: stringNum,
    });
  };

  return (
    <div className="guitar-container chordcraft-bg-secondary rounded-lg p-6 mb-6">
      <div className="fretboard relative">
        <div className="fret-lines absolute inset-0">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="fret-line"
              style={{ left: `${8.33 * (i + 1)}%` }}
            />
          ))}
        </div>
        
        <div className="strings">
          {strings.map(({ string, tuning, baseFrequency, notes }) => (
            <div key={string} className="string" data-string={string}>
              <span className="string-label">{tuning}</span>
              {notes.map((note, fret) => {
                const fretKey = `${string}-${fret}`;
                return (
                  <button
                    key={fret}
                    className={`fret-button ${activeFrets.has(fretKey) ? 'active' : ''}`}
                    onClick={() => handleFretPress(string, fret, note, baseFrequency)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
