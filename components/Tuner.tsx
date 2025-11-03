import React, { useState, useEffect, useRef } from 'react';
import { NOTES } from '../constants';

// This function determines the closest musical note to a given frequency
const getNoteFromFrequency = (frequency: number): { noteName: string; cents: number } | null => {
    if (frequency <= 0) return null;

    // Calculate how many semitones away from A4 (440Hz) the frequency is.
    const semitonesFromA4 = 12 * Math.log2(frequency / 440);
    const nearestSemitone = Math.round(semitonesFromA4);
    
    // Find the note index in our NOTES array (A is at index 9)
    const noteIndex = (9 + nearestSemitone % 12 + 12) % 12;
    const noteName = NOTES[noteIndex];
    
    // Calculate the "perfect" frequency of the detected note
    const perfectFrequency = 440 * Math.pow(2, nearestSemitone / 12);
    
    // Calculate the difference in cents
    const cents = 1200 * Math.log2(frequency / perfectFrequency);
    
    return { noteName, cents };
};

interface TunerProps {}

const Tuner: React.FC<TunerProps> = () => {
    const [isListening, setIsListening] = useState(false);
    const [centsOff, setCentsOff] = useState(0);
    const [detectedNote, setDetectedNote] = useState('...');
    const [error, setError] = useState<string | null>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>();

    const startListening = async () => {
        try {
            setError(null);
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Microphone access is not supported by your browser.');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Fix: Correctly instantiate AudioContext for cross-browser compatibility.
            // The constructor is called without arguments to support both modern AudioContext
            // and the legacy webkitAudioContext, and we check if it's supported first.
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
              throw new Error('AudioContext is not supported by your browser.');
            }
            // Fix: Using the aliased constructor is cleaner and avoids redundancy.
            const context = new AudioContext();
            audioContextRef.current = context;

            const source = context.createMediaStreamSource(stream);
            sourceRef.current = source;

            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            source.connect(analyser);
            setIsListening(true);
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message || "Could not access microphone.");
            } else {
                setError("An unknown error occurred while accessing the microphone.");
            }
        }
    };

    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        setIsListening(false);
        setDetectedNote('...');
        setCentsOff(0);
    };

    const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
        const SIZE = buf.length;
        const rms = Math.sqrt(buf.reduce((acc, val) => acc + val * val, 0) / SIZE);
        if (rms < 0.01) return -1; // Not enough signal

        let r1 = 0, r2 = SIZE - 1;
        const threshold = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < threshold) {
                r1 = i;
                break;
            }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < threshold) {
                r2 = SIZE - i;
                break;
            }
        }
        const buf2 = buf.slice(r1, r2);
        const SIZE2 = buf2.length;
        const c = new Array(SIZE2).fill(0);
        for (let i = 0; i < SIZE2; i++) {
            for (let j = 0; j < SIZE2 - i; j++) {
                c[i] = c[i] + buf2[j] * buf2[j + i];
            }
        }

        let d = 0;
        while (d < c.length && c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < c.length; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        if (maxpos === -1) return -1;
        
        // Parabolic interpolation for more accurate peak finding
        const T0 = maxpos;
        const y1 = c[T0-1], y2 = c[T0], y3 = c[T0+1];
        const a = (y1 + y3 - 2 * y2) / 2;
        const b = (y3 - y1) / 2;
        if (a) maxpos = T0 - b / (2 * a);

        return sampleRate / maxpos;
    };


    const updatePitch = () => {
        if (analyserRef.current && audioContextRef.current) {
            const buffer = new Float32Array(analyserRef.current.fftSize);
            analyserRef.current.getFloatTimeDomainData(buffer);
            const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);

            if (frequency !== -1) {
                const noteInfo = getNoteFromFrequency(frequency);
                if (noteInfo) {
                    setDetectedNote(noteInfo.noteName);
                    setCentsOff(noteInfo.cents);
                }
            } else {
                 setDetectedNote('...');
                 setCentsOff(0);
            }
        }
        animationFrameRef.current = requestAnimationFrame(updatePitch);
    };
    
    useEffect(() => {
        if(isListening) {
             animationFrameRef.current = requestAnimationFrame(updatePitch);
        }
        return () => {
            if(animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isListening]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => stopListening();
    }, []);

    const needleRotation = Math.max(-45, Math.min(45, centsOff * 0.9));
    let color = 'text-gray-400';
    let ringColor = 'stroke-gray-600';

    if (detectedNote !== '...') {
        if (Math.abs(centsOff) < 5) {
            color = 'text-green-400';
            ringColor = 'stroke-green-500';
        } else if (Math.abs(centsOff) < 20) {
            color = 'text-yellow-400';
            ringColor = 'stroke-yellow-500';
        } else {
            color = 'text-red-400';
            ringColor = 'stroke-red-500';
        }
    }


    return (
        <div className="flex flex-col items-center gap-6 p-4 rounded-lg bg-gray-900/50 w-full max-w-md mx-auto">
             {!isListening ? (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-gray-400">A chromatic tuner to help you tune any note.</p>
                    <button
                        onClick={startListening}
                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                        Start Tuner
                    </button>
                    {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
                </div>
            ) : (
                <>
                    <div className="relative w-64 h-32">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                            <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#374151" strokeWidth="4" />
                            <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" className={`transition-colors duration-200 ${ringColor}`} strokeWidth="4" strokeDasharray="2 3" />

                             {/* Needle */}
                            <line
                                x1="50" y1="50" x2="50" y2="10"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                                strokeLinecap="round"
                                style={{
                                    transformOrigin: '50px 50px',
                                    transform: `rotate(${needleRotation}deg)`,
                                    transition: 'transform 0.1s ease-out'
                                }}
                            />
                            <circle cx="50" cy="50" r="3" fill="#e5e7eb" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-1 text-center">
                            <p className={`text-5xl font-bold font-mono transition-colors duration-200 ${color}`}>{detectedNote}</p>
                            <p className={`text-sm font-semibold transition-colors duration-200 ${color}`}>
                                {Math.abs(centsOff) < 5 && detectedNote !== '...' ? 'In Tune' : `${centsOff.toFixed(1)} cents`}
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={stopListening}
                        className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-md shadow transition-colors"
                    >
                        Stop
                    </button>
                </>
            )}
        </div>
    );
};

export default Tuner;