
import React, { useState, useMemo, useEffect } from 'react';
import { InstrumentType, Scale, Chord, ViewMode } from './types';
import { 
    INSTRUMENTS, CHORDS, GUITAR_TUNING, BASS_TUNING, FRET_COUNT, 
    PIANO_KEY_COUNT, CHORD_TYPE_TO_MOVABLE_SHAPES, 
    GUITAR_MOVABLE_SHAPES, NOTES, SCALES
} from './constants';
import { getNotesFromIntervals, getNoteName, identifyChord, getFretForNoteOnString } from './services/musicService';
import Piano from './components/Piano';
import Fretboard from './components/Fretboard';
import Controls from './components/Controls';
import Metronome from './components/Metronome';
import ChordDiagram from './components/ChordDiagram';
import Tuner from './components/Tuner';
import MobileNav from './components/MobileNav';

const App: React.FC = () => {
    const [instrument, setInstrument] = useState<InstrumentType>('Piano');
    const [rootNote, setRootNote] = useState<string>('C');
    const [scales] = useState<Scale[]>(SCALES);
    const [selectedScale, setSelectedScale] = useState<Scale>(SCALES[0]);
    const [selectedChord, setSelectedChord] = useState<Omit<Chord, 'diagram'>>(CHORDS[0]);
    const [viewMode, setViewMode] = useState<ViewMode>('Scales');
    const [selectedVoicingIndex, setSelectedVoicingIndex] = useState(0);

    // State for Chord Identifier
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [identifiedChord, setIdentifiedChord] = useState<string | null>(null);
    const [identifiedRoot, setIdentifiedRoot] = useState<string | null>(null);

    const [showBetaBanner, setShowBetaBanner] = useState(true);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://buttons.github.io/buttons.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://buttons.github.io/buttons.js"]');
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
        };
    }, []);

    useEffect(() => {
        setSelectedVoicingIndex(0);
    }, [rootNote, selectedChord, instrument]);

    useEffect(() => {
        setSelectedNotes([]);
    }, [viewMode]);

    useEffect(() => {
        if (viewMode === 'Chord Identifier') {
            if (selectedNotes.length > 1) {
                const notesWithoutOctaves = selectedNotes.map(note => getNoteName(note));
                const result = identifyChord(notesWithoutOctaves);

                if (result) {
                    setIdentifiedChord(`${result.root} ${result.name}`);
                    setIdentifiedRoot(result.root);
                } else {
                    setIdentifiedChord('Chord not identified');
                    setIdentifiedRoot(null);
                }
            } else {
                setIdentifiedChord(null);
                setIdentifiedRoot(null);
            }
        }
    }, [selectedNotes, viewMode]);

    const notesToHighlight = useMemo(() => {
        if (viewMode === 'Chord Identifier') return selectedNotes;
        if (viewMode !== 'Scales' && viewMode !== 'Chords') return [];

        const intervals = viewMode === 'Scales' ? selectedScale.intervals : selectedChord.intervals;
        return getNotesFromIntervals(rootNote, intervals);
    }, [rootNote, selectedScale, selectedChord, viewMode, selectedNotes]);

    const activeRootNote = useMemo(() => {
        return viewMode === 'Chord Identifier' ? identifiedRoot : rootNote;
    }, [viewMode, rootNote, identifiedRoot]);

    const handleNoteSelect = (note: string) => {
        if (viewMode !== 'Chord Identifier') return;
        setSelectedNotes(prev => 
            prev.includes(note) 
                ? prev.filter(n => n !== note) 
                : [...prev, note]
        );
    };

    const possibleChordVoicings = useMemo(() => {
        if (instrument !== 'Guitar' || viewMode !== 'Chords') return [];

        const shapeNames = CHORD_TYPE_TO_MOVABLE_SHAPES[selectedChord.name];
        if (!shapeNames) return [];

        const voicings: { diagram: Chord['diagram'], position: number }[] = [];

        for (const shapeName of shapeNames) {
            const shape = GUITAR_MOVABLE_SHAPES[shapeName];
            if (!shape) continue;

            const openStringNote = GUITAR_TUNING.notes[shape.rootString];
            const rootFret = getFretForNoteOnString(rootNote, openStringNote);
            
            if (rootFret >= 0 && rootFret <= FRET_COUNT) {
                const finalFrets = shape.frets.map(f => (f === -1 ? -1 : f + rootFret));
                
                if (Math.max(...finalFrets) > FRET_COUNT) continue;

                const finalBarres = rootFret > 0 ? shape.barres?.map(b => ({
                    ...b,
                    fret: rootFret,
                })) : undefined;

                voicings.push({
                    diagram: {
                        frets: finalFrets,
                        fingers: shape.fingers,
                        barres: finalBarres,
                    },
                    position: rootFret,
                });
            }
        }
        
        voicings.sort((a, b) => {
            const minFretA = Math.min(...a.diagram.frets.filter(f => f >= 0));
            const minFretB = Math.min(...b.diagram.frets.filter(f => f >= 0));
            return minFretA - minFretB;
        });
        
        return voicings;

    }, [instrument, viewMode, rootNote, selectedChord]);
    
    const activeChordDiagram = possibleChordVoicings[selectedVoicingIndex]?.diagram;

    const startingFretForDiagram = useMemo(() => {
        if (!activeChordDiagram) return 0;
        const { frets } = activeChordDiagram;
        const positiveFrets = frets.filter(f => f > 0);
        
        if (positiveFrets.length === 0) return 0;
        if (frets.includes(0)) return 0;

        return Math.min(...positiveFrets);
    }, [activeChordDiagram]);
    
    const ChordIdentifierDisplay = () => {
        const displayedNotes = [...new Set(selectedNotes.map(getNoteName))].sort((a: string, b: string) => NOTES.indexOf(a) - NOTES.indexOf(b));

        return (
            <div className="w-full max-w-md flex-shrink-0 text-center p-4 bg-gray-900/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-300">Chord Identifier</h3>
                <p className="text-sm text-gray-400 mb-4">Click notes on the instrument to identify a chord.</p>
                <div className="min-h-[3rem] bg-gray-800 rounded-md p-2 flex items-center justify-center flex-wrap gap-2 mb-4 shadow-inner">
                    {displayedNotes.length > 0 ? displayedNotes.map(n => <span key={n} className="px-2 py-1 bg-gray-600 rounded text-sm font-mono">{n}</span>) : <span className="text-gray-500">No notes selected</span>}
                </div>
                <div className="min-h-[2rem] text-2xl font-bold text-cyan-400">
                    {identifiedChord || '...'}
                </div>
                {selectedNotes.length > 0 && (
                    <button onClick={() => setSelectedNotes([])} className="mt-4 px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-gray-800">
                        Clear Selection
                    </button>
                )}
            </div>
        );
    };

    const renderInstrument = () => {
        const commonProps = {
            notesToHighlight: notesToHighlight,
            rootNote: activeRootNote,
            viewMode: viewMode,
            onNoteSelect: handleNoteSelect,
            selectedNotes: viewMode === 'Chord Identifier' ? selectedNotes : [],
        };

        switch (instrument) {
            case 'Piano':
                if (viewMode === 'Chord Identifier') return <div className="flex flex-col items-center gap-8 w-full"><ChordIdentifierDisplay /><Piano {...commonProps} /></div>;
                return <Piano {...commonProps} />;
            case 'Guitar':
                 return (
                    <div className="flex flex-col items-center gap-8 w-full">
                        {viewMode === 'Chords' && (
                            <div className="w-full max-w-xs flex-shrink-0">
                                <h3 className="text-center font-semibold text-lg mb-2 text-gray-300">{rootNote}{selectedChord.diagramName} Chord</h3>
                                {activeChordDiagram ? (
                                    <>
                                        <ChordDiagram 
                                            diagram={activeChordDiagram} 
                                            tuning={GUITAR_TUNING.notes}
                                            chordName={`${rootNote}${selectedChord.diagramName} Chord`}
                                        />
                                        
                                        {startingFretForDiagram > 0 && (
                                            <p className="text-center text-gray-400 mt-2 text-sm">
                                                Position starts at fret {startingFretForDiagram}
                                            </p>
                                        )}
                                        
                                        {possibleChordVoicings.length > 1 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <button 
                                                    onClick={() => setSelectedVoicingIndex(prev => (prev - 1 + possibleChordVoicings.length) % possibleChordVoicings.length)}
                                                    className="px-4 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                                                >
                                                    &larr; Prev
                                                </button>
                                                <p className="text-sm font-medium text-gray-400">
                                                    Voicing {selectedVoicingIndex + 1} of {possibleChordVoicings.length}
                                                </p>
                                                <button 
                                                    onClick={() => setSelectedVoicingIndex(prev => (prev + 1) % possibleChordVoicings.length)}
                                                    className="px-4 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                                                >
                                                    Next &rarr;
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-gray-700 p-4 rounded-lg shadow-inner flex items-center justify-center h-[230px]">
                                        <p className="text-gray-400 text-center">No diagram available for this chord.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {viewMode === 'Chord Identifier' && <ChordIdentifierDisplay />}
                        <Fretboard {...commonProps} tuning={GUITAR_TUNING.notes} maxFretCount={FRET_COUNT} />
                    </div>
                );
            case 'Bass':
                 return (
                    <div className="flex flex-col items-center w-full gap-8">
                        {viewMode === 'Chords' && 
                            <p className="text-center text-gray-400 text-sm bg-gray-900/50 px-3 py-1 rounded-md">
                                Showing all chord tones. Fretboard diagrams are for visualization.
                            </p>
                        }
                        {viewMode === 'Chord Identifier' && <ChordIdentifierDisplay />}
                        <Fretboard {...commonProps} tuning={BASS_TUNING.notes} maxFretCount={FRET_COUNT} />
                    </div>
                );
            default:
                return null;
        }
    };

    const isMobileSelectionDisabled = viewMode === 'Chord Identifier';

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8 flex flex-col items-center antialiased pb-24 lg:pb-8">
            {showBetaBanner && (
                <div className="w-full max-w-7xl mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg text-center text-sm flex items-center justify-between shadow-lg" role="alert">
                    <div>
                        <strong className="font-semibold">Beta Notice:</strong> This application is a work in progress. Features may change and you might encounter some bugs.
                    </div>
                    <button 
                        onClick={() => setShowBetaBanner(false)} 
                        className="ml-4 p-1 rounded-md text-amber-400 hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            )}
            <header className="w-full max-w-7xl mb-6 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-wider">
                    Music Tools
                </h1>
                <p className="text-lg text-gray-400 mt-2 sm:mt-4">Your Interactive Companion for Music Theory</p>
                <div className="mt-4">
                    <a
                        className="github-button"
                        href="https://github.com/Emmotte/music-tools"
                        data-icon="octicon-star"
                        data-size="large"
                        data-show-count="true"
                        data-color-scheme="no-preference: dark; light: dark; dark: dark;"
                        aria-label="Star Emmotte/music-tools on GitHub">
                        Star
                    </a>
                </div>
            </header>

            <main className="w-full max-w-7xl bg-gray-800 rounded-lg shadow-2xl lg:p-6">
                 {/* --- Desktop Layout --- */}
                <div className="hidden lg:block">
                    <Controls
                        instrument={instrument} setInstrument={setInstrument}
                        rootNote={rootNote} setRootNote={setRootNote}
                        scales={scales}
                        selectedScale={selectedScale} 
                        setSelectedScale={setSelectedScale}
                        selectedChord={selectedChord} setSelectedChord={setSelectedChord}
                        viewMode={viewMode} setViewMode={setViewMode}
                    />
                    <div className="mt-8 flex flex-row gap-8 min-h-[500px]">
                        <div className="flex-grow flex justify-center items-start pt-4">
                            {viewMode === 'Tuner' ? (
                                <Tuner />
                            ) : (
                                <div className="relative overflow-x-auto pb-4 w-full flex justify-center">
                                    <div className="inline-block">
                                        {renderInstrument()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <aside className="w-72 flex-shrink-0">
                            <Metronome />
                        </aside>
                    </div>
                </div>

                {/* --- Mobile Layout --- */}
                <div className="lg:hidden">
                    {viewMode === 'Tuner' ? (
                        <div className="p-4 flex justify-center">
                            <Tuner />
                        </div>
                    ) : viewMode === 'Metronome' ? (
                        <div className="p-4 flex justify-center">
                           <Metronome />
                        </div>
                    ) : (
                        <>
                            <div className="p-4 flex flex-col gap-4">
                                {/* Instrument Selector */}
                                <div>
                                    <div className="flex items-center bg-gray-900 rounded-md p-1 shadow-inner">
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
                                
                                {/* Note and Scale/Chord Selectors */}
                                <div className={`grid grid-cols-2 gap-3 ${isMobileSelectionDisabled ? 'opacity-25 pointer-events-none' : ''} transition-opacity`}>
                                    <div>
                                        <label htmlFor="mobileRootNote" className="block text-xs font-medium text-gray-400 mb-1">Root</label>
                                        <select
                                            id="mobileRootNote"
                                            value={rootNote}
                                            onChange={(e) => setRootNote(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        >
                                            {NOTES.map((note) => (
                                                <option key={note} value={note}>{note}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="mobile-scale-or-chord" className="block text-xs font-medium text-gray-400 mb-1">{viewMode === 'Scales' ? 'Scale' : 'Chord'}</label>
                                        {viewMode === 'Scales' ? (
                                            <select
                                                id="mobile-scale-or-chord"
                                                value={selectedScale.name}
                                                onChange={(e) => {
                                                    const newScale = scales.find(s => s.name === e.target.value);
                                                    if (newScale) setSelectedScale(newScale);
                                                }}
                                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500 transition"
                                            >
                                                {scales.map((scale) => (
                                                    <option key={scale.name} value={scale.name}>{scale.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                id="mobile-scale-or-chord"
                                                value={selectedChord.name}
                                                onChange={(e) => {
                                                    const newChord = CHORDS.find(c => c.name === e.target.value);
                                                    if (newChord) setSelectedChord(newChord);
                                                }}
                                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500 transition"
                                            >
                                                {CHORDS.map((chord) => (
                                                    <option key={chord.name} value={chord.name}>{chord.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="relative overflow-x-auto pb-4 flex justify-center -mx-4 sm:-mx-6">
                                <div className="pt-4 inline-block">
                                    {renderInstrument()}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <MobileNav 
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

             <footer className="w-full max-w-7xl mt-8 text-center text-gray-500 text-sm">
                <p>This application is currently in beta. All feedback is welcome!</p>
                <a href="https://github.com/Emmotte/music-tools/issues" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-cyan-400 hover:text-cyan-300 transition-colors">
                    Report an Issue on GitHub
                </a>
            </footer>
        </div>
    );
};

export default App;
