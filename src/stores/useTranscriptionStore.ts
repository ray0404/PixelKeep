import { create } from 'zustand';
import TranscriptionWorker from '../workers/transcription.worker.ts?worker';

interface TranscriptionState {
    isDownloading: boolean;
    progress: number;
    isTranscribing: boolean;
    status: string;
    step: 'idle' | 'preparing' | 'downloading' | 'processing' | 'transcribing' | 'complete' | 'error';
    error: string | null;
    lastResult: string | null;
    
    setDownloading: (isDownloading: boolean) => void;
    setProgress: (progress: number) => void;
    setTranscribing: (isTranscribing: boolean) => void;
    setStatus: (status: string) => void;
    setError: (error: string | null) => void;
    transcribe: (audioBlob: Blob) => Promise<void>;
    reset: () => void;
}

let worker: Worker | null = null;
let progressInterval: any = null;

const clearProgressInterval = () => {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
};

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
    isDownloading: false,
    progress: 0,
    isTranscribing: false,
    status: '',
    step: 'idle',
    error: null,
    lastResult: null,

    setDownloading: (isDownloading) => set({ isDownloading }),
    setProgress: (progress) => set({ progress }),
    setTranscribing: (isTranscribing) => set({ isTranscribing }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),

    transcribe: async (audioBlob) => {
        clearProgressInterval();
        set({ isTranscribing: true, step: 'preparing', status: 'Preparing the Altar...', lastResult: null, error: null });
        try {
            if (!worker) {
                worker = new TranscriptionWorker();
            }

            // Step 1: Decode Audio (No more fetching!)
            set({ status: 'Interpreting the Waves...', step: 'processing', progress: 10 });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const float32Data = audioBuffer.getChannelData(0);

            worker!.onmessage = (event) => {
                const { type, data } = event.data;
                switch (type) {
                    case 'STATUS':
                        if (data === 'Reading the Echo...') {
                            set({ status: data, progress: 30 });
                            // Start fake progress
                            clearProgressInterval();
                            progressInterval = setInterval(() => {
                                const { progress } = get();
                                if (progress < 90) {
                                    set({ progress: progress + (Math.random() * 2) });
                                }
                            }, 200);
                        } else if (data === 'Scribing the Vision...') {
                             // Keep the interval going but update status
                             set({ status: data });
                        } else {
                            set({ status: data });
                        }
                        break;
                    case 'DOWNLOAD_PROGRESS':
                        if (data.status === 'progress') {
                            set({ isDownloading: true, step: 'downloading', progress: data.progress });
                        } else if (data.status === 'ready' || data.status === 'done') {
                            set({ isDownloading: false, step: 'transcribing', progress: 50 });
                        }
                        break;
                    case 'COMPLETE':
                        clearProgressInterval();
                        set({ isTranscribing: false, step: 'complete', progress: 100, status: 'Ritual Complete', lastResult: data });
                        break;
                    case 'ERROR':
                        clearProgressInterval();
                        set({ isTranscribing: false, step: 'error', error: data });
                        break;
                }
            };

            worker!.postMessage({
                type: 'TRANSCRIBE',
                data: { audio: float32Data }
            }, [float32Data.buffer]);

        } catch (error: any) {
            clearProgressInterval();
            console.error('Transcription Store Error:', error);
            set({ isTranscribing: false, step: 'error', error: `Store Error: ${error.message}` });
        }
    },

    reset: () => {
        clearProgressInterval();
        set({ 
            isDownloading: false, 
            progress: 0, 
            isTranscribing: false, 
            status: '', 
            step: 'idle', 
            error: null,
            lastResult: null 
        });
    },
}));
