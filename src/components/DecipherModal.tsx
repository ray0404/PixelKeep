import React from 'react';
import { PixelModal } from './ui/PixelModal';
import { PixelProgressBar } from './ui/PixelProgressBar';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { cn } from '../utils/ui';

interface DecipherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DecipherModal: React.FC<DecipherModalProps> = ({ isOpen, onClose }) => {
    const { status, progress, isDownloading, error } = useTranscriptionStore();

    return (
        <PixelModal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Deciphering Ritual"
        >
            <div className={cn(
                "p-4 space-y-6 text-center transition-all duration-500",
                !error && "animate-magical-glow"
            )}>
                <div className="space-y-2">
                    <span className="material-symbols-outlined text-6xl text-secondary animate-pulse">
                        auto_fix_high
                    </span>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                        {error ? "Ritual Interrupted" : status || "Preparing the Altar..."}
                    </h3>
                </div>

                {error ? (
                    <div className="p-3 border-2 border-danger bg-danger/10 text-danger text-[10px] font-bold">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <PixelProgressBar 
                            progress={progress} 
                            label={isDownloading ? "Model Download" : "Transcription"}
                            color={isDownloading ? "secondary" : "primary"}
                        />
                        
                        <p className="text-[8px] text-text-light/60 italic px-4">
                            {isDownloading 
                                ? "One-time invocation of the AI Oracle (~40MB). Please maintain your connection."
                                : "The Echo is being transcribed locally. Your privacy is protected."
                            }
                        </p>
                    </div>
                )}

                {error && (
                    <button 
                        onClick={onClose}
                        className="text-[10px] font-bold text-secondary underline hover:text-primary uppercase"
                    >
                        Close the Circle
                    </button>
                )}
            </div>
        </PixelModal>
    );
};
