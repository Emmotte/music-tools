import React from 'react';
import { ViewMode } from '../types';
import { getNoteName } from '../services/musicService';

interface PianoProps {
    notesToHighlight: string[];
    rootNote: string | null;
    keyCount: number;
    viewMode: ViewMode;
    onNoteSelect?: (note: string) => void;
}

const PIANO_LAYOUT = [
    { note: 'C', blackKey: 'C#' },
    { note: 'D', blackKey: 'D#' },
    { note: 'E' },
    { note: 'F', blackKey: 'F#' },
    { note: 'G', blackKey: 'G#' },
    { note: 'A', blackKey: 'A#' },
    { note: 'B' }
];

const START_OCTAVE = 3;
const WHITE_KEYS_TO_RENDER = 15; // Approx 2 octaves

const Piano: React.FC<PianoProps> = ({ notesToHighlight, rootNote, viewMode, onNoteSelect }) => {
    
    const isIdentifierMode = viewMode === 'Chord Identifier';

    const handleKeyClick = (note: string) => {
        if (isIdentifierMode && onNoteSelect) {
            onNoteSelect(note);
        }
    };

    const renderedKeys = [];
    let currentOctave = START_OCTAVE;

    for (let i = 0; i < WHITE_KEYS_TO_RENDER; i++) {
        const keyInfo = PIANO_LAYOUT[i % 7];
        if (keyInfo.note === 'C' && i > 0) {
            currentOctave++;
        }
        
        const whiteKeyFullName = `${keyInfo.note}${currentOctave}`;
        const whiteKeyNoteName = keyInfo.note;
        
        const blackKeyFullName = keyInfo.blackKey ? `${keyInfo.blackKey}${currentOctave}` : null;
        const blackKeyNoteName = keyInfo.blackKey;

        const isWhiteKeyInSet = isIdentifierMode ? notesToHighlight.includes(whiteKeyFullName) : notesToHighlight.includes(whiteKeyNoteName);
        const isWhiteKeyRoot = whiteKeyNoteName === rootNote;
        
        const isBlackKeyInSet = blackKeyFullName ? (isIdentifierMode ? notesToHighlight.includes(blackKeyFullName) : notesToHighlight.includes(blackKeyNoteName!)) : false;
        const isBlackKeyRoot = blackKeyNoteName === rootNote;

        const whiteKeyClasses = isWhiteKeyRoot 
            ? 'bg-cyan-500 text-white font-bold border-cyan-700' 
            : isWhiteKeyInSet
            ? isIdentifierMode ? 'bg-amber-400 text-gray-900 border-amber-600' : 'bg-sky-500 text-white border-sky-700' 
            : 'bg-white text-black border-gray-400';

        const blackKeyClasses = isBlackKeyRoot
            ? 'bg-cyan-400 text-black font-bold border-cyan-600'
            : isBlackKeyInSet
            ? isIdentifierMode ? 'bg-amber-300 text-black border-amber-500' : 'bg-sky-400 text-black border-sky-600'
            : 'bg-black text-white border-black';
        
        const cursorClass = isIdentifierMode ? 'cursor-pointer' : '';

        renderedKeys.push(
            <div key={i} className="relative h-full w-10 md:w-12 flex-shrink-0">
                {/* White Key */}
                <div 
                    className={`h-full w-full border-2 rounded-b-md flex items-end justify-center pb-2 transition-colors ${whiteKeyClasses} ${cursorClass}`}
                    onClick={() => handleKeyClick(whiteKeyFullName)}
                >
                    {whiteKeyNoteName}
                </div>
                
                {/* Black Key */}
                {blackKeyFullName && (
                    <div 
                        className={`absolute top-0 right-[-14px] md:right-[-16px] z-10 h-2/3 w-7 md:w-8 border-2 rounded-b-md flex items-end justify-center pb-1 text-xs font-semibold transition-colors ${blackKeyClasses} ${cursorClass}`}
                        onClick={(e) => { e.stopPropagation(); handleKeyClick(blackKeyFullName); }}
                    >
                        {blackKeyNoteName}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative flex w-full h-48 select-none justify-center">
            {renderedKeys}
        </div>
    );
};

export default Piano;