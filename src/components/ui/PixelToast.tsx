import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranscriptionStore } from '../../stores/useTranscriptionStore';
import { PixelButton } from './PixelButton';

export const PixelToast: React.FC = () => {
    const { step, activeNoteId, reset } = useTranscriptionStore();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (step === 'complete') {
            setIsVisible(true);
        }
    }, [step]);

    if (!isVisible || step !== 'complete') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-surface border-2 border-border-light shadow-pixel-container p-4 max-w-sm flex flex-col gap-2">
                <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-bold text-primary text-shadow-pixel">RITUAL COMPLETE!</span>
                    <button onClick={() => { setIsVisible(false); reset(); }} className="text-secondary hover:text-danger">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
                <p className="text-xs text-text-light">The Oracle has spoken.</p>
                {activeNoteId && (
                    <PixelButton className="h-8 text-[10px]" onClick={() => {
                        navigate(`/notes/${activeNoteId}`);
                        setIsVisible(false);
                    }}>
                        GO TO SCROLL
                    </PixelButton>
                )}
            </div>
        </div>
    );
};
