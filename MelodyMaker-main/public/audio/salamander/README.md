# Salamander Grand Piano Samples

Place the Salamander Grand Piano .wav files in this directory structure:

```
public/audio/salamander/
├── A0v8.wav
├── C1v8.wav
├── E1v8.wav
├── A1v8.wav
├── C2v8.wav
├── E2v8.wav
├── A2v8.wav
├── C3v8.wav
├── E3v8.wav
├── A3v8.wav
├── C4v8.wav
├── E4v8.wav
├── A4v8.wav
├── C5v8.wav
├── E5v8.wav
├── A5v8.wav
├── C6v8.wav
├── E6v8.wav
├── A6v8.wav
└── C7v8.wav
```

## How to get the samples:

1. Clone the Salamander repository: `git clone https://github.com/sfzinstruments/SalamanderGrandPiano.git`
2. Copy the .wav files from `48khz24bit/` directory
3. Rename them to match the expected format (e.g., `A0v8.wav`)
4. Place them in this directory

The application will automatically detect and use these samples when available, falling back to synthesis if not found.