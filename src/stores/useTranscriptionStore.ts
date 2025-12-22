import { create } from 'zustand';

interface TranscriptionState {
    isDownloading: boolean;
    progress: number;
    isTranscribing: boolean;
    error: string | null;
    
    setDownloading: (isDownloading: boolean) => void;
    setProgress: (progress: number) => void;
    setTranscribing: (isTranscribing: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
    isDownloading: false,
    progress: 0,
    isTranscribing: false,
    error: null,

    setDownloading: (isDownloading) => set({ isDownloading }),
    setProgress: (progress) => set({ progress }),
    setTranscribing: (isTranscribing) => set({ isTranscribing }),
    setError: (error) => set({ error }),
    reset: () => set({ isDownloading: false, progress: 0, isTranscribing: false, error: null }),
}));
