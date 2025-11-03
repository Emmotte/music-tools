export type InstrumentType = 'Piano' | 'Guitar' | 'Bass';
export type ViewMode = 'Scales' | 'Chords' | 'Tuner' | 'Chord Identifier';

export interface Scale {
  name: string;
  intervals: number[];
}

export interface Chord {
    name: string;
    intervals: number[];
    diagramName?: string;
    diagram?: {
        frets: number[];
        fingers: number[];
        barres?: { fret: number, fromString: number, toString: number }[];
    }
}

export interface Tuning {
  name: string;
  notes: string[];
}