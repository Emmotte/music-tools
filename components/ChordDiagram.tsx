import React from 'react';
import { Chord } from '../types';
import { NOTES } from '../constants';
import { getNoteName } from '../services/musicService';

interface ChordDiagramProps {
    diagram: Required<Chord>['diagram'];
    tuning: string[];
    chordName: string;
}

const getNoteIndex = (note: string) => NOTES.indexOf(getNoteName(note));

const ChordDiagram: React.FC<ChordDiagramProps> = ({ diagram, tuning, chordName }) => {
    const { frets, fingers, barres } = diagram;
    const numStrings = tuning.length;
    const numFrets = 5;
    const width = 120;
    const height = 150;
    const startX = 20;
    const startY = 30;
    const fretHeight = (height - startY) / numFrets;
    const stringWidth = (width - startX) / (numStrings - 1);

    const positiveFrets = frets.filter(f => f > 0);
    let fretOffset = 0;

    // If there are fretted notes and it's not an open chord, calculate the starting fret for the diagram window
    if (positiveFrets.length > 0 && !frets.includes(0)) {
        const minFret = Math.min(...positiveFrets);
        fretOffset = minFret - 1;
    }

    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-inner">
            <svg viewBox={`0 0 ${width + 10} ${height + 10}`} width="100%" height="auto" aria-label={`Chord diagram for ${chordName}`}>
                <rect width={width+10} height={height+10} fill="transparent" />

                {/* Fret numbers */}
                {fretOffset > 0 && Array.from({ length: numFrets }).map((_, i) => (
                    <text 
                        key={`fret-num-${i}`}
                        x={startX - 12} 
                        y={startY + (i * fretHeight) + (fretHeight / 2)} 
                        fontSize="12" 
                        fill="#a0aec0" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                    >
                        {fretOffset + i + 1}
                    </text>
                ))}
                
                {/* Nut/Top Fret */}
                <line x1={startX} y1={startY} x2={width} y2={startY} stroke={fretOffset > 0 ? "#718096" : "#E2E8F0"} strokeWidth={fretOffset > 0 ? "2" : "4"} />

                {/* Frets */}
                {Array.from({ length: numFrets }).map((_, i) => (
                    <line key={i} x1={startX} y1={startY + (i + 1) * fretHeight} x2={width} y2={startY + (i + 1) * fretHeight} stroke="#718096" strokeWidth="1" />
                ))}

                {/* Strings */}
                {Array.from({ length: numStrings }).map((_, i) => (
                    <line key={i} x1={startX + i * stringWidth} y1={startY} x2={startX + i * stringWidth} y2={height} stroke="#718096" strokeWidth="1" />
                ))}

                {/* Barre Chords */}
                {barres && barres.map((barre, index) => {
                     const barreFret = barre.fret - fretOffset;
                     const fromStringIndex = numStrings - barre.fromString;
                     const toStringIndex = numStrings - barre.toString;
                     const x = startX + toStringIndex * stringWidth;
                     const y = startY + (barreFret-1) * fretHeight + fretHeight / 2;
                     const barreWidth = (fromStringIndex - toStringIndex) * stringWidth;
                     return (
                        <rect key={index} x={x} y={y - 7} width={barreWidth} height={14} rx="7" fill="#38bdf8" />
                     );
                })}

                {/* Finger positions */}
                {frets.map((fret, index) => {
                    const stringIndex = numStrings - 1 - index;
                    const finger = fingers[index];

                    if (fret === -1) { // Muted string
                        const x = startX + stringIndex * stringWidth;
                        return (
                            <g key={index} transform={`translate(${x}, ${startY - 12})`}>
                                <line x1="-4" y1="-4" x2="4" y2="4" stroke="#a0aec0" strokeWidth="2" />
                                <line x1="-4" y1="4" x2="4" y2="-4" stroke="#a0aec0" strokeWidth="2" />
                            </g>
                        );
                    }
                    if (fret === 0) { // Open string
                         return (
                            <circle key={index} cx={startX + stringIndex * stringWidth} cy={startY - 10} r="4" stroke="#a0aec0" strokeWidth="2" fill="none" />
                        );
                    }
                    if (fret > 0) {
                        const displayFret = fret - fretOffset;
                        if (displayFret < 1 || displayFret > numFrets) return null; // Don't draw dots outside the 5-fret window

                        const x = startX + stringIndex * stringWidth;
                        const y = startY + (displayFret - 1) * fretHeight + fretHeight / 2;
                        
                        const isBarred = barres?.some(b => fret === b.fret && index >= (numStrings - b.toString) && index <= (numStrings - b.fromString));
                        
                        // Finger dots are drawn on top of barres unless it's the main barre finger
                        if(isBarred && fingers[index] === 1) return null;

                        return (
                            <g key={index}>
                                <circle cx={x} cy={y} r="8" fill="#38bdf8" />
                                {finger > 0 && <text x={x} y={y} fontSize="12" fill="#1e293b" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">{finger}</text>}
                            </g>
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
};

export default ChordDiagram;