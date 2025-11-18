import { Scale, Tuning, InstrumentType, Chord } from './types';

// Data structures for scales and chords are inspired by and compatible with:
// https://github.com/ShirelleW/RiffTheoryBackend

export const SCALES: Scale[] = [
  { name: 'Major', intervals: [2,2,1,2,2,2,1] },
  { name: 'Natural Minor', intervals: [2,1,2,2,1,2,2] },
  { name: 'Harmonic Minor', intervals: [2,1,2,2,1,3,1] },
  { name: 'Melodic Minor', intervals: [2,1,2,2,2,2,1] },
  { name: 'Major Pentatonic', intervals: [2,2,3,2,3] },
  { name: 'Minor Pentatonic', intervals: [3,2,2,3,2] },
  { name: 'Blues', intervals: [3,2,1,1,3,2] },
  { name: 'Dorian', intervals: [2,1,2,2,2,1,2] },
  { name: 'Phrygian', intervals: [1,2,2,2,1,2,2] },
  { name: 'Lydian', intervals: [2,2,2,1,2,2,1] },
  { name: 'Mixolydian', intervals: [2,2,1,2,2,1,2] },
  { name: 'Locrian', intervals: [1,2,2,1,2,2,2] },
  { name: 'Whole Tone', intervals: [2,2,2,2,2,2] },
  { name: 'Diminished (H-W)', intervals: [1,2,1,2,1,2,1,2] },
  { name: 'Diminished (W-H)', intervals: [2,1,2,1,2,1,2,1] },
  { name: 'Augmented', intervals: [3,1,3,1,3,1] }
];

export const NOTES: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const INSTRUMENTS: InstrumentType[] = ['Piano', 'Guitar', 'Bass'];

export const CHORDS: Omit<Chord, 'diagram'>[] = [
    { name: 'Major Triad', intervals: [4, 3], diagramName: '' },
    { name: 'Minor Triad', intervals: [3, 4], diagramName: 'm' },
    { name: 'Diminished Triad', intervals: [3, 3], diagramName: 'dim' },
    { name: 'Augmented Triad', intervals: [4, 4], diagramName: 'aug' },
    { name: 'Suspended 2nd', intervals: [2, 5], diagramName: 'sus2' },
    { name: 'Suspended 4th', intervals: [5, 2], diagramName: 'sus4' },
    { name: 'Major 7th', intervals: [4, 3, 4], diagramName: 'maj7' },
    { name: 'Minor 7th', intervals: [3, 4, 3], diagramName: 'm7' },
    { name: 'Dominant 7th', intervals: [4, 3, 3], diagramName: '7' },
    { name: 'Diminished 7th', intervals: [3, 3, 3], diagramName: 'dim7' },
    { name: 'Half-Diminished 7th', intervals: [3, 3, 4], diagramName: 'm7b5' },
    { name: 'Major 6th', intervals: [4, 3, 2], diagramName: '6' },
    { name: 'Minor 6th', intervals: [3, 4, 2], diagramName: 'm6' },
    { name: 'Major 9th', intervals: [4, 3, 4, 3], diagramName: 'maj9' },
    { name: 'Minor 9th', intervals: [3, 4, 3, 4], diagramName: 'm9' },
    { name: 'Dominant 9th', intervals: [4, 3, 3, 4], diagramName: '9' },
];

// Helper to convert "x" from voicing data to -1 for diagramming
const parseFrets = (frets: (string|number)[]): number[] => {
    return frets.map(f => f === 'x' ? -1 : f as number);
};

export interface ChordShape {
    name: string;
    rootString: number; // 0=E, 1=A, etc. (low to high).
    frets: number[]; // relative frets from the root fret (which is 0).
    fingers: number[];
    barres?: { fromString: number, toString: number }[];
}

// Movable shapes based on CAGED system. Frets are relative to the barre.
export const GUITAR_MOVABLE_SHAPES: { [key: string]: ChordShape } = {
    E_MAJOR:  { name: "E Major Shape", rootString: 0, frets: parseFrets([0, 2, 2, 1, 0, 0]), fingers: parseFrets([1, 3, 4, 2, 1, 1]), barres: [{ fromString: 0, toString: 5 }] },
    E_MINOR:  { name: "E Minor Shape", rootString: 0, frets: parseFrets([0, 2, 2, 0, 0, 0]), fingers: parseFrets([1, 3, 4, 1, 1, 1]), barres: [{ fromString: 0, toString: 5 }] },
    E_DOM7:   { name: "E Dom7 Shape",  rootString: 0, frets: parseFrets([0, 2, 0, 1, 0, 0]), fingers: parseFrets([1, 3, 1, 2, 1, 1]), barres: [{ fromString: 0, toString: 5 }] },
    E_MAJ7:   { name: "E Maj7 Shape",  rootString: 0, frets: parseFrets([0, 2, 1, 1, 0, 0]), fingers: parseFrets([1, 3, 2, 2, 1, 1]), barres: [{ fromString: 0, toString: 5 }] },
    E_MIN7:   { name: "E Min7 Shape",  rootString: 0, frets: parseFrets([0, 2, 0, 0, 0, 0]), fingers: parseFrets([1, 3, 1, 1, 1, 1]), barres: [{ fromString: 0, toString: 5 }] },
    
    A_MAJOR:  { name: "A Major Shape", rootString: 1, frets: parseFrets(['x', 0, 2, 2, 2, 0]), fingers: parseFrets(['x', 1, 3, 4, 2, 1]), barres: [{ fromString: 1, toString: 5 }] },
    A_MINOR:  { name: "A Minor Shape", rootString: 1, frets: parseFrets(['x', 0, 2, 2, 1, 0]), fingers: parseFrets(['x', 1, 3, 4, 2, 1]), barres: [{ fromString: 1, toString: 5 }] },
    A_DOM7:   { name: "A Dom7 Shape",  rootString: 1, frets: parseFrets(['x', 0, 2, 0, 2, 0]), fingers: parseFrets(['x', 1, 3, 1, 4, 1]), barres: [{ fromString: 1, toString: 5 }] },
    A_MAJ7:   { name: "A Maj7 Shape",  rootString: 1, frets: parseFrets(['x', 0, 2, 1, 2, 0]), fingers: parseFrets(['x', 1, 3, 2, 4, 1]), barres: [{ fromString: 1, toString: 5 }] },
    A_MIN7:   { name: "A Min7 Shape",  rootString: 1, frets: parseFrets(['x', 0, 2, 0, 1, 0]), fingers: parseFrets(['x', 1, 3, 1, 2, 1]), barres: [{ fromString: 1, toString: 5 }] },

    D_MAJOR:  { name: "D Major Shape", rootString: 3, frets: parseFrets(['x', 'x', 0, 2, 3, 2]), fingers: parseFrets(['x', 'x', 1, 2, 4, 3])},
    D_MINOR:  { name: "D Minor Shape", rootString: 3, frets: parseFrets(['x', 'x', 0, 2, 3, 1]), fingers: parseFrets(['x', 'x', 1, 2, 4, 3])},
    D_DOM7:   { name: "D Dom7 Shape",  rootString: 3, frets: parseFrets(['x', 'x', 0, 2, 1, 2]), fingers: parseFrets(['x', 'x', 1, 3, 2, 4])},
    D_MAJ7:   { name: "D Maj7 Shape",  rootString: 3, frets: parseFrets(['x', 'x', 0, 2, 2, 2]), fingers: parseFrets(['x', 'x', 1, 2, 3, 4])},
    D_MIN7:   { name: "D Min7 Shape",  rootString: 3, frets: parseFrets(['x', 'x', 0, 2, 1, 1]), fingers: parseFrets(['x', 'x', 1, 3, 2, 2])},
};

// Map chord types to movable shapes. The system will find all valid shapes.
export const CHORD_TYPE_TO_MOVABLE_SHAPES: { [chordName: string]: string[] } = {
    "Major Triad": ["E_MAJOR", "A_MAJOR", "D_MAJOR"],
    "Minor Triad": ["E_MINOR", "A_MINOR", "D_MINOR"],
    "Dominant 7th": ["E_DOM7", "A_DOM7", "D_DOM7"],
    "Major 7th": ["E_MAJ7", "A_MAJ7", "D_MAJ7"],
    "Minor 7th": ["E_MIN7", "A_MIN7", "D_MIN7"],
};


// Tunings are listed from lowest pitch string to highest pitch string.
export const GUITAR_TUNING: Tuning = {
  name: 'Standard',
  notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
};

export const BASS_TUNING: Tuning = {
  name: 'Standard',
  notes: ['E1', 'A1', 'D2', 'G2']
};

export const FRET_COUNT = 24;
export const PIANO_KEY_COUNT = 24; // 2 octaves