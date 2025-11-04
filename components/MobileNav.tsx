

import React from 'react';
import { ViewMode } from '../types';

interface MobileNavProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ScalesIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18h2" />
        <path d="M8 18h2" />
        <path d="M12 18h2" />
        <path d="M16 18h2" />
        <path d="M4 14h2" />
        <path d="M8 14h2" />
        <path d="M12 14h2" />
        <path d="M4 10h2" />
        <path d="M8 10h2" />
        <path d="M4 6h2" />
    </svg>
);
const ChordsIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="3" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="18" cy="6" r="3" />
    </svg>
);
const ChordIdIcon = ({ isActive }: { isActive: boolean }) => (
     <svg className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M11 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        <path d="M11 14v-1.5"/>
    </svg>
);
const MetronomeIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 12 12 22 2 12 12 2" /><line x1="12" y1="22" x2="12" y2="12" />
    </svg>
);
const TunerIcon = ({ isActive }: { isActive: boolean }) => (
    <svg className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" /><polyline points="12 9 12 12 13.5 13.5" /><path d="M16.51 17.35l-1.83-1.83" /><path d="M7.49 17.35l1.83-1.83" /><path d="M12 19.5V22" />
    </svg>
);

const MobileNav: React.FC<MobileNavProps> = ({ viewMode, setViewMode }) => {
    
    const navItems = [
        { id: 'Scales', label: 'Scales', icon: ScalesIcon, isActive: viewMode === 'Scales', onClick: () => setViewMode('Scales') },
        { id: 'Chords', label: 'Chords', icon: ChordsIcon, isActive: viewMode === 'Chords', onClick: () => setViewMode('Chords') },
        { id: 'Chord Identifier', label: 'Chord ID', icon: ChordIdIcon, isActive: viewMode === 'Chord Identifier', onClick: () => setViewMode('Chord Identifier') },
        { id: 'Tuner', label: 'Tuner', icon: TunerIcon, isActive: viewMode === 'Tuner', onClick: () => setViewMode('Tuner') },
        { id: 'Metronome', label: 'Metronome', icon: MetronomeIcon, isActive: viewMode === 'Metronome', onClick: () => setViewMode('Metronome') },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700 shadow-lg flex justify-around items-center z-50 lg:hidden">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium focus:outline-none transition-colors ${item.isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                    aria-current={item.isActive ? 'page' : undefined}
                >
                    <item.icon isActive={item.isActive} />
                    {item.label}
                </button>
            ))}
        </nav>
    );
};

export default MobileNav;