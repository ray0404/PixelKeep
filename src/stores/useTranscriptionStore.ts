import { create } from 'zustand';

interface TranscriptionState {
    isDownloading: boolean;
    progress: number;
    isTranscribing: boolean;
    status: string;
    error: string | null;
    
    setDownloading: (isDownloading: boolean) => void;
    setProgress: (progress: number) => void;
    setTranscribing: (isTranscribing: boolean) => void;
    setStatus: (status: string) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
    isDownloading: false,
    progress: 0,
    isTranscribing: false,
    status: '',
    error: null,

    setDownloading: (isDownloading) => set({ isDownloading }),
    setProgress: (progress) => set({ progress }),
    setTranscribing: (isTranscribing) => set({ isTranscribing }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    reset: () => set({ isDownloading: false, progress: 0, isTranscribing: false, status: '', error: null }),
}));
