import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Square,
  Download,
  Save,
  Trash2,
  Music,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PianoKeyboard } from "@/components/piano-keyboard";
import { GuitarFretboard } from "@/components/guitar-fretboard";
import { ChordBuilder } from "@/components/chord-builder";
import { getScaleNotes } from "@/lib/music-theory";
import { SequenceDisplay } from "@/components/sequence-display";
import { AudioEngine } from "@/lib/audio-engine";
import { SalamanderPiano } from "@/lib/salamander-piano";
import { exportMIDI } from "@/lib/midi-export";
import { exportWAV } from "@/lib/wav-export";
import type { Note, Chord, Sequence } from "@shared/schema";

export default function MusicStudio() {
  const [bpm, setBpm] = useState(120);
  const [currentInstrument, setCurrentInstrument] = useState<
    "piano" | "guitar" | "bass" | "synth"
  >("piano");
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedScale, setSelectedScale] = useState("major");
  const [currentSequence, setCurrentSequence] = useState<Note[]>([]);
  const [chordProgression, setChordProgression] = useState<Chord[]>([]);
  const [highlightedNotes, setHighlightedNotes] = useState<string[]>([]);
  const [hoveredChord, setHoveredChord] = useState<Chord | null>(null);
  const [salamanderLoaded, setSalamanderLoaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const audioEngine = new AudioEngine();
  const salamanderPiano = new SalamanderPiano();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioEngine.initialize();

        // Initialize Salamander piano
        if (audioEngine.audioContext) {
          await salamanderPiano.initialize(audioEngine.audioContext);
          setSalamanderLoaded(salamanderPiano.isAvailable());

          if (salamanderPiano.isAvailable()) {
            toast({ 
              title: "🎹 Salamander Piano Loaded!", 
              description: "High-quality piano samples are ready to play." 
            });
          } else {
            toast({ 
              title: "🎹 Audio Engine Ready!", 
              description: "Using synthesized piano sounds." 
            });
          }
        }

        document.removeEventListener("click", initAudio);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        toast({ 
          title: "Audio initialization failed", 
          description: "Please check your browser's audio permissions.",
          variant: "destructive" 
        });
      }
    };
    document.addEventListener("click", initAudio, { once: true });
  }, [audioEngine, salamanderPiano, toast]);

  // Update tempo pulse animation
  useEffect(() => {
    const beatDuration = 60 / bpm;
    document.documentElement.style.setProperty(
      "--beat-duration",
      `${beatDuration}s`,
    );
  }, [bpm]);

  // Fetch sequences
  const { data: sequences = [] } = useQuery<Sequence[]>({
    queryKey: ["/api/sequences"],
  });

  // Save sequence mutation
  const saveSequenceMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      notes: Note[];
      chords: Chord[];
    }) => {
      return apiRequest("POST", "/api/sequences", {
        name: data.name,
        bpm,
        instrument: currentInstrument,
        notes: data.notes,
        chords: data.chords,
        scale: selectedScale,
        key: selectedKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sequences"] });
      toast({ title: "Sequence saved successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to save sequence", variant: "destructive" });
    },
  });

  const handleNotePlay = (note: Note) => {
    // Try to use Salamander piano samples first, fall back to synthesis
    if (salamanderLoaded && currentInstrument === 'piano') {
      const noteName = note.note + '4'; // Default to octave 4
      const success = salamanderPiano.playNote(noteName, note.velocity || 0.7);
      if (!success) {
        audioEngine.playNote(note.frequency, currentInstrument);
      }
    } else {
      audioEngine.playNote(note.frequency, currentInstrument);
    }

    if (isRecording) {
      setCurrentSequence((prev) => [
        ...prev,
        { ...note, timestamp: Date.now() },
      ]);
    }
  };

  // Listen for chord hover events to highlight piano keys
  useEffect(() => {
    const handleChordHover = (event: CustomEvent) => {
      const chord = event.detail;
      if (chord && chord.notes) {
        // Map chord notes to piano keys for highlighting
        const highlightedKeys: string[] = [];
        chord.notes.forEach((note: string) => {
          const baseNote = note.replace(/[0-9]/g, ""); // Remove octave numbers
          highlightedKeys.push(baseNote + "3"); // Map to octave 3 for display
        });
        setHighlightedNotes(highlightedKeys);
      } else {
        setHighlightedNotes([]);
      }
      setHoveredChord(chord);
    };

    window.addEventListener("chordHover", handleChordHover as EventListener);
    return () =>
      window.removeEventListener(
        "chordHover",
        handleChordHover as EventListener,
      );
  }, []);

  const handleChordPlay = (chord: Chord) => {
    // Try to use Salamander piano samples first, fall back to synthesis
    if (salamanderLoaded && currentInstrument === 'piano') {
      chord.notes.forEach((noteName: string) => {
        const success = salamanderPiano.playNote(noteName + '4', 0.7); // Default to octave 4
        if (!success) {
          audioEngine.playNote(440, currentInstrument); // Fallback frequency
        }
      });
    } else {
      audioEngine.playChord(chord, currentInstrument);
    }

    if (isRecording) {
      setChordProgression((prev) => [
        ...prev,
        { ...chord, timestamp: Date.now() },
      ]);
    }
  };

  const handleChordAdd = (chord: Chord) => {
    setChordProgression((prev) => [
      ...prev,
      { ...chord, timestamp: Date.now() },
    ]);
  };

  const handleChordRemove = (index: number) => {
    setChordProgression((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlay = () => {
    if (currentSequence.length === 0 && chordProgression.length === 0) {
      toast({ title: "No sequence to play", variant: "destructive" });
      return;
    }

    setIsPlaying(true);
    audioEngine
      .playSequence(currentSequence, chordProgression, bpm, currentInstrument)
      .finally(() => setIsPlaying(false));
  };

  const handleStop = () => {
    setIsPlaying(false);
    audioEngine.stopAll();
  };

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setCurrentSequence([]);
      setChordProgression([]);
      toast({ title: "Recording started" });
    } else {
      toast({ title: "Recording stopped" });
    }
  };

  const handleClear = () => {
    setCurrentSequence([]);
    setChordProgression([]);
    toast({ title: "Sequence cleared" });
  };

  const handleSave = () => {
    if (currentSequence.length === 0 && chordProgression.length === 0) {
      toast({ title: "Nothing to save", variant: "destructive" });
      return;
    }

    const name = `Sequence ${new Date().toLocaleString()}`;
    saveSequenceMutation.mutate({
      name,
      notes: currentSequence,
      chords: chordProgression,
    });
  };

  const handleExportMIDI = async () => {
    if (currentSequence.length === 0 && chordProgression.length === 0) {
      toast({ title: "Nothing to export", variant: "destructive" });
      return;
    }

    try {
      await exportMIDI(currentSequence, chordProgression, bpm);
      toast({ title: "MIDI exported successfully!" });
    } catch (error) {
      toast({ title: "Failed to export MIDI", variant: "destructive" });
    }
  };

  const handleExportWAV = async () => {
    if (currentSequence.length === 0 && chordProgression.length === 0) {
      toast({ title: "Nothing to export", variant: "destructive" });
      return;
    }

    try {
      await exportWAV(
        currentSequence,
        chordProgression,
        bpm,
        currentInstrument,
        audioEngine,
      );
      toast({ title: "WAV exported successfully!" });
    } catch (error) {
      toast({ title: "Failed to export WAV", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen chordcraft-bg-primary text-slate-100">
      {/* Header */}
      <header className="chordcraft-bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Music
                className="text-2xl"
                style={{ color: "var(--chordcraft-accent)" }}
              />
              <h1 className="text-2xl font-bold text-white">ChordCraft</h1>
            </div>
            <span className="text-sm text-gray-400">
              Music Creation Made Simple
            </span>
            <span className={`text-xs px-2 py-1 rounded ${salamanderLoaded ? 'text-green-400 bg-green-900/20' : 'text-blue-400 bg-blue-900/20'}`}>
              {salamanderLoaded ? '🎹 Salamander Piano Active' : '🎵 Synth Engine Active'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* BPM Controls */}
            <Card className="chordcraft-bg-primary px-4 py-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-300">BPM</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0"
                    style={{ backgroundColor: "var(--chordcraft-accent)" }}
                    onClick={() => setBpm(Math.max(60, bpm - 5))}
                  >
                    -
                  </Button>
                  <span
                    className="w-12 text-center font-bold"
                    style={{ color: "var(--chordcraft-accent)" }}
                  >
                    {bpm}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0"
                    style={{ backgroundColor: "var(--chordcraft-accent)" }}
                    onClick={() => setBpm(Math.min(200, bpm + 5))}
                  >
                    +
                  </Button>
                </div>
              </div>
            </Card>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700"
                onClick={handlePlay}
                disabled={isPlaying}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700"
                onClick={handleStop}
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={`w-10 h-10 rounded-full ${isRecording ? "bg-red-600 animate-pulse" : "bg-gray-600"} hover:bg-gray-700`}
                onClick={handleRecord}
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            {/* Export Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExportMIDI}
                style={{ backgroundColor: "var(--chordcraft-accent)" }}
                className="hover:opacity-80"
              >
                <Download className="w-4 h-4 mr-2" />
                Export MIDI
              </Button>
              <Button
                onClick={handleExportWAV}
                style={{ backgroundColor: "var(--chordcraft-accent-purple)" }}
                className="hover:opacity-80"
              >
                <Download className="w-4 h-4 mr-2" />
                Export WAV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col overflow-hidden">
        {/* Top Control Panel */}
        <div className="chordcraft-bg-secondary border-b border-gray-700 p-4 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="space-y-4">
            {/* Top Row: Instrument & Scale */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
              {/* Instrument Selector */}
              <div>
                <h3 className="text-md font-semibold mb-2 text-white">
                  Instrument
                </h3>
                <Select
                  value={currentInstrument}
                  onValueChange={(value) => setCurrentInstrument(value as any)}
                >
                  <SelectTrigger className="w-full chordcraft-bg-primary border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piano">
                      🎹 Piano {salamanderLoaded ? '(Samples)' : '(Synth)'}
                    </SelectItem>
                    <SelectItem value="guitar">🎸 Guitar</SelectItem>
                    <SelectItem value="bass">🎸 Bass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Key Selector */}
              <div>
                <h3 className="text-md font-semibold mb-2 text-white">Key</h3>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger className="w-full chordcraft-bg-primary border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "C",
                      "C#",
                      "D",
                      "D#",
                      "E",
                      "F",
                      "F#",
                      "G",
                      "G#",
                      "A",
                      "A#",
                      "B",
                    ].map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scale Selector */}
              <div>
                <h3 className="text-md font-semibold mb-2 text-white">Scale</h3>
                <Select value={selectedScale} onValueChange={setSelectedScale}>
                  <SelectTrigger className="w-full chordcraft-bg-primary border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "major", label: "Major" },
                      { value: "minor", label: "Minor" },
                      { value: "pentatonic", label: "Pentatonic" },
                      { value: "blues", label: "Blues" },
                      { value: "dorian", label: "Dorian" },
                      { value: "mixolydian", label: "Mixolydian" },
                    ].map((scale) => (
                      <SelectItem key={scale.value} value={scale.value}>
                        {scale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Play Scale Button */}
              <div>
                <Button
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => {
                    const scaleNotes = getScaleNotes(
                      selectedKey,
                      selectedScale,
                    );
                    audioEngine.playScale(scaleNotes, currentInstrument);
                  }}
                >
                  Play Scale
                </Button>
              </div>
            </div>

            {/* Bottom Row: Chord Builder */}
            <div>
              <ChordBuilder
                selectedKey={selectedKey}
                selectedScale={selectedScale}
                chordProgression={chordProgression}
                onChordPlay={handleChordPlay}
                onChordRemove={handleChordRemove}
                onChordAdd={handleChordAdd}
                onProgressionPlay={() =>
                  audioEngine.playChordProgression(
                    chordProgression,
                    bpm,
                    currentInstrument,
                  )
                }
                bpm={bpm}
                onBpmChange={setBpm}
              />
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Instrument Display Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs
              value={currentInstrument}
              onValueChange={(value) => setCurrentInstrument(value as any)}
            >
              <TabsList className="hidden">
                <TabsTrigger value="piano">Piano</TabsTrigger>
                <TabsTrigger value="guitar">Guitar</TabsTrigger>
                <TabsTrigger value="bass">Bass</TabsTrigger>
              </TabsList>

              <TabsContent value="piano">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Virtual Piano {salamanderLoaded ? '(High Quality Samples)' : '(Synthesized)'}
                </h2>
                <PianoKeyboard
                  onNotePlay={handleNotePlay}
                  highlightedNotes={highlightedNotes}
                />
              </TabsContent>

              <TabsContent value="guitar">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Virtual Guitar
                </h2>
                <GuitarFretboard onNotePlay={handleNotePlay} />
              </TabsContent>

              <TabsContent value="bass">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Virtual Bass
                </h2>
                <PianoKeyboard
                  onNotePlay={handleNotePlay}
                  octaveShift={-2}
                  highlightedNotes={highlightedNotes}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Bottom Control Panel */}
          <div className="chordcraft-bg-secondary border-t border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-6">
                <SequenceDisplay
                  notes={currentSequence}
                  chords={chordProgression}
                  isRecording={isRecording}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="destructive"
                  onClick={handleClear}
                  disabled={
                    currentSequence.length === 0 &&
                    chordProgression.length === 0
                  }
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSave}
                  disabled={
                    currentSequence.length === 0 &&
                    chordProgression.length === 0
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}