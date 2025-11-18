import React, { useState, useEffect, useRef } from 'react';

const Metronome: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(120);
    const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
    const [beatValue, setBeatValue] = useState(4); // For UI, now affects audio logic
    const [isEditingBpm, setIsEditingBpm] = useState(false);
    const [visualCurrentBeat, setVisualCurrentBeat] = useState(-1);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef<number>(0);
    const currentBeatRef = useRef<number>(0);
    const schedulerIntervalRef = useRef<number | undefined>(undefined);
    const visualBeatRef = useRef<HTMLDivElement>(null);

    const scheduleAheadTime = 0.1; // seconds
    const lookahead = 25.0; // ms

    const scheduleNote = (beatNumber: number, time: number) => {
        if (!audioContextRef.current) return;
        
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);

        // Accent the first beat of the measure
        const isAccent = beatNumber % beatsPerMeasure === 0;
        osc.frequency.value = isAccent ? 880.0 : 440.0;
        gain.gain.setValueAtTime(0.5, time); // Start with some volume
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.start(time);
        osc.stop(time + 0.1);
        
        // Visual feedback
        const beatInMeasure = beatNumber % beatsPerMeasure;
        setTimeout(() => {
            setVisualCurrentBeat(beatInMeasure);
            if(visualBeatRef.current) {
                visualBeatRef.current.style.transform = 'scale(1.1)';
                visualBeatRef.current.style.backgroundColor = isAccent ? '#22d3ee' : '#67e8f9';
                 setTimeout(() => {
                     if(visualBeatRef.current) {
                        visualBeatRef.current.style.transform = 'scale(1)';
                        visualBeatRef.current.style.backgroundColor = '#06b6d4';
                     }
                 }, 100);
            }
        }, (time - audioContextRef.current.currentTime) * 1000);
    };

    const scheduler = () => {
        if (!audioContextRef.current) return;

        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
            scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
            // BPM is treated as quarter notes per minute. Adjust beat duration based on time signature denominator.
            const secondsPerBeat = (60.0 / bpm) * (4 / beatValue);
            nextNoteTimeRef.current += secondsPerBeat;
            currentBeatRef.current = (currentBeatRef.current + 1);
        }
    };
    
    // Main scheduler effect
    useEffect(() => {
        if (isPlaying) {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
             if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.1;
            currentBeatRef.current = 0; // Reset beat count on play
            schedulerIntervalRef.current = window.setInterval(scheduler, lookahead);
        } else {
            clearInterval(schedulerIntervalRef.current);
        }

        return () => {
            clearInterval(schedulerIntervalRef.current);
        };
    }, [isPlaying, bpm, beatsPerMeasure, beatValue]);

    // Reset beat count if time signature changes while playing
    useEffect(() => {
        currentBeatRef.current = 0;
        setVisualCurrentBeat(-1);
    }, [beatsPerMeasure]);

    const handlePlayToggle = () => {
        setIsPlaying(prevIsPlaying => {
            if (prevIsPlaying) { // If we are about to stop
                setVisualCurrentBeat(-1);
            }
            return !prevIsPlaying;
        });
    };

    const handleBpmInput = (newBpm: number) => {
        if (newBpm >= 20 && newBpm <= 300) {
            setBpm(newBpm);
        }
    }

    const handleBpmBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 20) {
            setBpm(20);
        } else if (value > 300) {
            setBpm(300);
        }
        setIsEditingBpm(false);
    }


    return (
        <div className="bg-gray-700/50 rounded-lg p-4 flex flex-col items-center gap-4 h-full">
            <h3 className="text-lg font-semibold text-gray-300">Metronome</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
                 <div className="absolute w-full h-full bg-gray-800 rounded-full"></div>
                 <div 
                    ref={visualBeatRef}
                    className="absolute w-28 h-28 bg-cyan-600 rounded-full transition-all duration-100"
                    style={{transition: 'transform 0.05s ease-out, background-color 0.05s ease-out'}}>
                 </div>
                 <div className="relative text-5xl font-mono font-bold text-white tracking-tighter">
                    {isEditingBpm ? (
                        <input
                            type="number"
                            value={bpm}
                            onChange={(e) => handleBpmInput(parseInt(e.target.value, 10) || 0)}
                            onBlur={handleBpmBlur}
                            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            className="w-32 text-center bg-transparent outline-none focus:ring-2 focus:ring-cyan-400 rounded-md"
                            autoFocus
                        />
                    ) : (
                        <div 
                            onClick={() => setIsEditingBpm(true)}
                            className="cursor-pointer px-2 py-1 rounded-md hover:bg-gray-700 transition-colors"
                            aria-label="Edit BPM"
                        >
                            {bpm}
                        </div>
                    )}
                 </div>
            </div>
           
            <p className="text-sm text-gray-400 -mt-2">BPM</p>
            
            <input
                type="range"
                min="20"
                max="300"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                aria-label="BPM Slider"
            />
            <div className="flex justify-center gap-2 h-4 items-center">
                {Array.from({ length: beatsPerMeasure }).map((_, index) => {
                    const isCurrentBeat = index === visualCurrentBeat;
                    const isFirstBeat = index === 0;

                    const size = isCurrentBeat 
                        ? (isFirstBeat ? 'w-3.5 h-3.5' : 'w-3 h-3') 
                        : (isFirstBeat ? 'w-2.5 h-2.5' : 'w-2 h-2');

                    const color = isCurrentBeat 
                        ? (isFirstBeat ? 'bg-cyan-400' : 'bg-sky-400') 
                        : 'bg-gray-500';

                    return <div key={index} className={`${size} ${color} rounded-full transition-all duration-150 ease-in-out`} />;
                })}
            </div>
             <div className="flex items-center gap-3 text-sm text-gray-400">
                <label htmlFor="beatsPerMeasure" className="font-medium">Time Signature</label>
                <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-md">
                    <select
                        id="beatsPerMeasure"
                        value={beatsPerMeasure}
                        onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
                        className="bg-transparent text-white focus:outline-none cursor-pointer"
                        aria-label="Beats per measure"
                    >
                        {[2,3,4,5,6,7].map(n => <option className="bg-gray-800 text-black" key={n} value={n}>{n}</option>)}
                    </select>
                    <span>/</span>
                    <select
                        value={beatValue}
                        onChange={(e) => setBeatValue(Number(e.target.value))}
                         className="bg-transparent text-white focus:outline-none cursor-pointer"
                         aria-label="Beat value"
                    >
                        <option className="bg-gray-800 text-black" value={4}>4</option>
                        <option className="bg-gray-800 text-black" value={8}>8</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handlePlayToggle}
                className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                aria-label={isPlaying ? 'Pause Metronome' : 'Play Metronome'}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default Metronome;