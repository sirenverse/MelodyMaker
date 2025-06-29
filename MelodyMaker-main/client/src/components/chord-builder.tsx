import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Trash2, X } from "lucide-react";
import { getChordsForScale } from "@/lib/music-theory";
import type { Chord } from "@shared/schema";

interface ChordBuilderProps {
  selectedKey: string;
  selectedScale: string;
  chordProgression: Chord[];
  onChordPlay: (chord: Chord) => void;
  onProgressionPlay: () => void;
  onChordRemove?: (index: number) => void;
  onChordAdd?: (chord: Chord) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  salamanderPiano?: any; // For enhanced piano sounds (optional)
}

export function ChordBuilder({ 
  selectedKey, 
  selectedScale,
  chordProgression, 
  onChordPlay, 
  onProgressionPlay,
  onChordRemove,
  onChordAdd,
  bpm,
  onBpmChange,
  salamanderPiano
}: ChordBuilderProps) {
  // Always show all chords - don't filter based on piano samples
  const scaleChords = getChordsForScale(selectedKey, selectedScale);

  const handleChordClick = (chord: { name: string; notes: string[] }) => {
    const chordObj: Chord = {
      name: chord.name,
      notes: chord.notes,
      timestamp: Date.now(),
    };
    
    onChordPlay(chordObj);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Chord Builder</h3>
      
      {/* Scale Chords */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          {selectedKey} {selectedScale ? selectedScale.charAt(0).toUpperCase() + selectedScale.slice(1) : 'Major'} Scale Chords ({scaleChords.length})
          {salamanderPiano && (
            <span className="text-xs text-green-400 ml-2">
              (Enhanced with piano samples)
            </span>
          )}
        </h4>
        <div className="grid grid-cols-8 gap-1 bg-gray-900/50 p-2 rounded-lg border border-gray-600">
          {scaleChords.map((chord, index) => (
            <Button
              key={`${chord.name}-${index}`}
              variant="outline"
              size="sm"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(chord));
              }}
              className="chordcraft-bg-primary hover:chordcraft-bg-accent hover:scale-105 text-white font-medium text-xs p-1 min-h-[32px] transition-all duration-200 border-gray-500 hover:border-blue-400 cursor-grab active:cursor-grabbing"
              onClick={() => handleChordClick(chord)}
              onDoubleClick={() => onChordAdd && onChordAdd({ ...chord, timestamp: Date.now() })}
              onMouseEnter={() => window.dispatchEvent(new CustomEvent('chordHover', { detail: chord }))}
              onMouseLeave={() => window.dispatchEvent(new CustomEvent('chordHover', { detail: null }))}
              title={`Click to play, double-click to add to progression, or drag to progression`}
            >
              {chord.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Chord Progression */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Chord Progression</h4>
        <div className="space-y-2">
          <div 
            className="bg-gray-900/50 border border-gray-600 rounded-lg p-3 min-h-[50px] flex items-center"
            onDrop={(e) => {
              e.preventDefault();
              try {
                const chordData = JSON.parse(e.dataTransfer.getData('application/json'));
                onChordAdd && onChordAdd({ ...chordData, timestamp: Date.now() });
              } catch (error) {
                console.error('Failed to parse dropped chord data');
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            {chordProgression.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {chordProgression.map((chord, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm text-white flex items-center gap-2 group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg"
                  >
                    {chord.name}
                    {onChordRemove && (
                      <button
                        onClick={() => onChordRemove(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm italic">Drag chords here or double-click chords above...</span>
            )}
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            onClick={onProgressionPlay}
            disabled={chordProgression.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Play Progression
          </Button>
        </div>
      </div>
    </div>
  );
}