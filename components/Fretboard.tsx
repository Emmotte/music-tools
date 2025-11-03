import React, { useMemo } from 'react';
import { ViewMode } from '../types';
import { getNoteName, getFullNoteOnFret, getFretForNoteOnString } from '../services/musicService';

interface FretboardProps {
    tuning: string[];
    maxFretCount: number;
    notesToHighlight: string[];
    rootNote: string | null;
    viewMode: ViewMode;
    onNoteSelect?: (note: string) => void;
}

const VIEWPORT_FRET_COUNT = 7;

const Fretboard: React.FC<FretboardProps> = ({ tuning, maxFretCount, notesToHighlight, rootNote, viewMode, onNoteSelect }) => {
    const isIdentifierMode = viewMode === 'Chord Identifier';

    const startFret = useMemo(() => {
        if (isIdentifierMode || !rootNote) {
            return 0;
        }

        let lowestRootFret = Infinity;
        // Find the lowest fret position for the root note on any string
        for (const stringNote of tuning) {
            const fret = getFretForNoteOnString(rootNote, stringNote);
            if (fret !== -1 && fret < lowestRootFret) {
                lowestRootFret = fret;
            }
        }
        
        if (lowestRootFret === Infinity || lowestRootFret < 3) {
             return 0; // Default to open position if root is low or not found
        }

        // Try to center the view around the first main occurrence of the root note.
        return Math.max(0, lowestRootFret - 2);

    }, [rootNote, tuning, isIdentifierMode]);

    const fretsToRender = Array.from({ length: VIEWPORT_FRET_COUNT + 1 }, (_, i) => i + startFret);
    const fretMarkers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]; // Expanded for higher frets
    const isNutVisible = startFret === 0;

    return (
        <div className="flex items-start">
            {startFret > 0 && (
                <div className="w-8 pt-5 text-right pr-2 text-sm text-gray-400 font-mono">
                    {startFret}fr
                </div>
            )}
            <div className="select-none font-mono min-w-max">
                {/* The `tuning` array is from low to high, so we reverse the display to show high string on top (standard tab layout) */}
                <div className="flex flex-col-reverse">
                    {tuning.map((stringNote, stringIndex) => (
                        <div key={stringIndex} className="flex items-center">
                            {fretsToRender.map((fret, fretIdx) => {
                                if (fret > maxFretCount) return null;
                                
                                const noteWithOctave = getFullNoteOnFret(stringNote, fret);
                                const noteName = getNoteName(noteWithOctave);

                                const isNoteInSet = isIdentifierMode 
                                    ? notesToHighlight.includes(noteWithOctave)
                                    : notesToHighlight.includes(noteName);
                                const isRootNote = noteName === rootNote;
                                
                                const noteClasses = isRootNote 
                                    ? 'bg-cyan-400 text-gray-900 ring-2 ring-cyan-200' 
                                    : isNoteInSet && isIdentifierMode 
                                        ? 'bg-amber-400 text-gray-900 ring-2 ring-amber-200'
                                        : 'bg-sky-500 text-white';

                                const handleFretClick = () => {
                                    if (isIdentifierMode && onNoteSelect) {
                                        onNoteSelect(noteWithOctave);
                                    }
                                };
                                
                                const isFirstColumn = fretIdx === 0;

                                // Open string / Nut column
                                if (isFirstColumn && isNutVisible) {
                                    return (
                                        <div 
                                            key={fret} 
                                            className={`w-10 h-10 flex items-center justify-center bg-gray-700 border-r-4 border-gray-500 ${isIdentifierMode ? 'cursor-pointer' : ''}`}
                                            onClick={handleFretClick}
                                        >
                                            {isNoteInSet && (
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${noteClasses}`}>
                                                    {noteName}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Fretted columns
                                return (
                                    <div 
                                        key={fret} 
                                        className={`relative w-20 h-10 flex items-center justify-center border-r-2 border-gray-600 bg-gradient-to-b from-gray-700 to-gray-800 ${isIdentifierMode ? 'cursor-pointer' : ''} ${isFirstColumn && !isNutVisible ? 'border-l-4 border-gray-500' : ''}`}
                                        onClick={handleFretClick}
                                    >
                                        <div className="absolute w-full h-px bg-gray-500 top-1/2 -translate-y-1/2 z-0"></div>
                                        
                                        {isNoteInSet && (
                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${isIdentifierMode ? '' : 'transform transition-transform hover:scale-110'} ${noteClasses}`}>
                                                {noteName}
                                            </div>
                                        )}

                                        {stringIndex === Math.floor(tuning.length / 2) && fretMarkers.includes(fret) && (
                                            <div className={`absolute bottom-1 w-3 h-3 rounded-full ${fret % 12 === 0 ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
                                        )}
                                        {stringIndex === Math.floor(tuning.length / 2) && fret % 12 === 0 && fret > 0 && (
                                             <div className="absolute top-1 w-3 h-3 rounded-full bg-gray-400"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex">
                    {fretsToRender.map((fret, fretIdx) => {
                         if (fret > maxFretCount) return null;
                         const isFirstColumn = fretIdx === 0;
                         return (
                            <div 
                                key={fret} 
                                className={`${isFirstColumn && isNutVisible ? 'w-10' : 'w-20'} text-center text-xs text-gray-400 pt-2`}
                            >
                                {fret}
                            </div>
                         )
                    })}
                </div>
            </div>
        </div>
    );
};

export default Fretboard;