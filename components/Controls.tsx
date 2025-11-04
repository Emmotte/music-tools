
import React from 'react';
import { InstrumentType, Scale, Chord, ViewMode } from '../types';
import { INSTRUMENTS, NOTES, CHORDS } from '../constants';

interface ControlsProps {
    instrument: InstrumentType;
    setInstrument: (instrument: InstrumentType) => void;
    rootNote: string;
    setRootNote: (note: string) => void;
    scales: Scale[];
    selectedScale: Scale;
    setSelectedScale: (scale: Scale) => void;
    selectedChord: Chord;
    setSelectedChord: (chord: Chord) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isMobileView?: boolean;
}

const Controls: React.FC<ControlsProps> = ({
    instrument,
    setInstrument,
    rootNote,
    setRootNote,
    scales,
    selectedScale,
    setSelectedScale,
    selectedChord,
    setSelectedChord,
    viewMode,
    setViewMode,
    isMobileView = false,
}) => {
    return (
        <div>
             {isMobileView && <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">Controls</h2>}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isMobileView ? '' : 'p-4 rounded-lg bg-gray-700/50'}`}>
                {/* Instrument Selector */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2 text-center md:text-left">Instrument</label>
                    <div className="flex items-center bg-gray-800 rounded-md p-1 shadow-inner">
                        {INSTRUMENTS.map((inst) => (
                            <button
                                key={inst}
                                onClick={() => setInstrument(inst)}
                                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                                    instrument === inst ? 'bg-cyan-500 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {inst}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Mode Selector */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2 text-center md:text-left">Mode</label>
                    <div className="flex items-center bg-gray-800 rounded-md p-1 shadow-inner">
                        {(['Scales', 'Chords', 'Chord Identifier'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                                    viewMode === mode ? 'bg-cyan-500 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Note and Scale/Chord Selectors */}
                <div className={`md:col-span-1 flex gap-4 ${viewMode === 'Tuner' || viewMode === 'Chord Identifier' ? 'opacity-25 pointer-events-none' : ''} transition-opacity`}>
                    <div className="w-1/3">
                        <label htmlFor="rootNote" className="block text-sm font-medium text-gray-400 mb-2">Root</label>
                        <select
                            id="rootNote"
                            value={rootNote}
                            onChange={(e) => setRootNote(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2.5 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        >
                            {NOTES.map((note) => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-2/3">
                        <label htmlFor="scale-or-chord" className="block text-sm font-medium text-gray-400 mb-2">{viewMode === 'Scales' ? 'Scale' : 'Chord'}</label>
                        {viewMode === 'Scales' ? (
                            <select
                                id="scale-or-chord"
                                value={selectedScale.name}
                                onChange={(e) => {
                                    const newScale = scales.find(s => s.name === e.target.value);
                                    if (newScale) setSelectedScale(newScale);
                                }}
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2.5 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            >
                                {scales.map((scale) => (
                                    <option key={scale.name} value={scale.name}>{scale.name}</option>
                                ))}
                            </select>
                        ) : (
                             <select
                                id="scale-or-chord"
                                value={selectedChord.name}
                                onChange={(e) => {
                                    const newChord = CHORDS.find(c => c.name === e.target.value);
                                    if (newChord) setSelectedChord(newChord);
                                }}
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2.5 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            >
                                {CHORDS.map((chord) => (
                                    <option key={chord.name} value={chord.name}>{chord.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;