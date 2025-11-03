import { NOTES, CHORDS } from '../constants';

export const getNoteName = (note: string): string => {
    // Handles notes like 'E4' -> 'E', 'C#3' -> 'C#'
    if (note.length > 1 && (note[1] === '#' || note[1] === 'b')) {
        return note.substring(0, 2);
    }
    return note.substring(0, 1);
};

export const getFretForNoteOnString = (note: string, stringNote: string): number => {
    const openNoteName = getNoteName(stringNote);
    const openNoteIndex = NOTES.indexOf(openNoteName);
    const targetNoteIndex = NOTES.indexOf(note);
    if (openNoteIndex === -1 || targetNoteIndex === -1) return -1;

    let fret = targetNoteIndex - openNoteIndex;
    if (fret < 0) fret += 12;
    return fret;
};


export const getFullNoteOnFret = (openStringNote: string, fret: number): string => {
    const openNoteName = getNoteName(openStringNote);
    const octaveMatch = openStringNote.match(/\d+$/);
    if (!octaveMatch) return openNoteName; // Fallback for notes without octaves
    
    const openOctave = parseInt(octaveMatch[0], 10);
    const openNoteIndex = NOTES.indexOf(openNoteName);

    if (openNoteIndex === -1) return '';

    const totalSemitones = openNoteIndex + fret;
    const noteIndex = totalSemitones % 12;
    const octaveOffset = Math.floor(totalSemitones / 12);

    const newNote = NOTES[noteIndex];
    const newOctave = openOctave + octaveOffset;
    
    return `${newNote}${newOctave}`;
};


export const getNotesFromIntervals = (rootNote: string, intervals: number[]): string[] => {
    const notes: string[] = [rootNote];
    let currentNoteIndex = NOTES.indexOf(rootNote);

    if (currentNoteIndex === -1) return [];

    // For scales, we want the full octave. For chords, just the specified notes.
    // The final interval in a scale list returns to the root, which we don't need to add again.
    const loopLength = intervals.length;


    for (let i = 0; i < loopLength; i++) {
        currentNoteIndex = (currentNoteIndex + intervals[i]) % 12;
        if (i < intervals.length) { // Prevent adding the final root note for scales
             notes.push(NOTES[currentNoteIndex]);
        }
    }
    
    // For scales, the intervals list completes the octave, so the final note is the root again.
    // We only want unique notes. For chords, this won't be an issue.
    const uniqueNotes = [...new Set(notes)];

    return uniqueNotes;
};

export const getFrequencyForNote = (note: string): number => {
    const noteName = getNoteName(note);
    const octaveMatch = note.match(/\d+$/);
    if (!octaveMatch) return 0; // Invalid note format

    const octave = parseInt(octaveMatch[0], 10);
    const noteIndex = NOTES.indexOf(noteName);

    if (noteIndex === -1) return 0;

    // A4 is the reference note at 440 Hz. It is the 10th note in our array (index 9) in the 4th octave.
    const a4Index = NOTES.indexOf('A');
    const a4Octave = 4;
    
    const halfStepsFromA4 = (noteIndex - a4Index) + (octave - a4Octave) * 12;

    return 440 * Math.pow(2, halfStepsFromA4 / 12);
};


// --- Chord Identification Logic ---

// Helper to get absolute intervals from a root (e.g., [4, 3] -> [4, 7])
const getAbsoluteIntervals = (relativeIntervals: number[]): number[] => {
    const absoluteIntervals: number[] = [];
    let sum = 0;
    for (const interval of relativeIntervals) {
        sum += interval;
        absoluteIntervals.push(sum % 12);
    }
    return absoluteIntervals;
};

// Pre-compute chord signatures for faster lookup.
// The signature is a sorted string of absolute intervals, e.g., "4,7" for a Major Triad.
const chordSignatures = new Map<string, { name: string }>();
CHORDS.forEach(chord => {
    const absoluteIntervals = getAbsoluteIntervals(chord.intervals);
    const signature = absoluteIntervals.sort((a, b) => a - b).join(',');
    if (!chordSignatures.has(signature)) {
        chordSignatures.set(signature, { name: chord.name });
    }
});


export const identifyChord = (notes: string[]): { root: string, name: string } | null => {
    const uniqueNotes = [...new Set(notes.map(getNoteName))];
    if (uniqueNotes.length < 2) return null; // Need at least two unique notes for a chord

    // Try each note as a potential root
    for (const potentialRoot of uniqueNotes) {
        const rootIndex = NOTES.indexOf(potentialRoot);
        if (rootIndex === -1) continue;

        const intervals = uniqueNotes
            .map(note => {
                const noteIndex = NOTES.indexOf(note);
                if (noteIndex === -1) return -1;
                let interval = noteIndex - rootIndex;
                if (interval < 0) interval += 12;
                return interval;
            })
            .filter(interval => interval > 0) // Exclude the root (interval 0)
            .sort((a, b) => a - b);
        
        const signature = intervals.join(',');

        if (chordSignatures.has(signature)) {
            return {
                root: potentialRoot,
                name: chordSignatures.get(signature)!.name,
            };
        }
    }

    return null; // No match found
};