import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";
import { getScaleNotes } from "@/lib/music-theory";
import type { Note } from "@shared/schema";
import type { AudioEngine } from "@/lib/audio-engine";

interface ScaleExplorerProps {
  selectedKey: string;
  selectedScale: string;
  onKeyChange: (key: string) => void;
  onScaleChange: (scale: string) => void;
  onNotePlay: (note: Note) => void;
  audioEngine: AudioEngine;
  instrument: string;
}

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scales = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
  { value: "mixolydian", label: "Mixolydian" },
];

export function ScaleExplorer({
  selectedKey,
  selectedScale,
  onKeyChange,
  onScaleChange,
  onNotePlay,
  audioEngine,
  instrument,
}: ScaleExplorerProps) {
  const handlePlayScale = () => {
    const scaleNotes = getScaleNotes(selectedKey, selectedScale);
    audioEngine.playScale(scaleNotes, instrument);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Scales</h3>
      
      <div className="flex items-center justify-between gap-3">
        <Select value={selectedKey} onValueChange={onKeyChange}>
          <SelectTrigger className="w-24 chordcraft-bg-primary border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {keys.map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedScale} onValueChange={onScaleChange}>
          <SelectTrigger className="flex-1 chordcraft-bg-primary border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scales.map((scale) => (
              <SelectItem key={scale.value} value={scale.value}>
                {scale.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        onClick={handlePlayScale}
      >
        <Play className="w-4 h-4 mr-2" />
        Play Scale
      </Button>
    </div>
  );
}
