import type { Note, Chord } from "@shared/schema";

interface SequenceDisplayProps {
  notes: Note[];
  chords: Chord[];
  isRecording: boolean;
}

export function SequenceDisplay({ notes, chords, isRecording }: SequenceDisplayProps) {
  const hasContent = notes.length > 0 || chords.length > 0;

  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <h4 className="text-sm font-medium text-gray-300">Current Sequence</h4>
        {isRecording && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-400">Recording</span>
          </div>
        )}
      </div>
      
      <div className="chordcraft-bg-primary rounded-lg p-3 min-h-[40px] flex items-center">
        {hasContent ? (
          <div className="flex flex-wrap gap-2">
            {chords.map((chord, index) => (
              <span
                key={`chord-${index}`}
                className="px-2 py-1 rounded text-sm text-white"
                style={{ backgroundColor: 'var(--chordcraft-accent)' }}
              >
                {chord.name}
              </span>
            ))}
            {notes.length > 0 && (
              <span
                className="px-2 py-1 rounded text-sm text-white"
                style={{ backgroundColor: 'var(--chordcraft-accent-purple)' }}
              >
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">
            {isRecording ? "Start playing to record..." : "No sequence recorded"}
          </span>
        )}
      </div>
    </div>
  );
}
