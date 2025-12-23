import { create } from 'zustand';
import TranscriptionWorker from '../workers/transcription.worker.ts?worker';
import { useNoteStore } from './useNoteStore';

interface TranscriptionState {
    isDownloading: boolean;
    progress: number;
    isTranscribing: boolean;
    status: string;
    error: string | null;
    lastResult: string | null;
    
    setDownloading: (isDownloading: boolean) => void;
    setProgress: (progress: number) => void;
    setTranscribing: (isTranscribing: boolean) => void;
    setStatus: (status: string) => void;
    setError: (error: string | null) => void;
    transcribe: (audioUrl: string) => Promise<void>;
    reset: () => void;
}

let worker: Worker | null = null;

export const useTranscriptionStore = create<TranscriptionState>((set, get) => ({
    isDownloading: false,
    progress: 0,
    isTranscribing: false,
    status: '',
    error: null,
    lastResult: null,

    setDownloading: (isDownloading) => set({ isDownloading }),
    setProgress: (progress) => set({ progress }),
    setTranscribing: (isTranscribing) => set({ isTranscribing }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),

    transcribe: async (audioUrl) => {
        set({ isTranscribing: true, status: 'Preparing the Altar...', lastResult: null, error: null });
        try {
            if (!worker) {
                worker = new TranscriptionWorker();
            }

            // Step 1: Fetch Audio
            set({ status: 'Gathering the Echo...' });
            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/html')) {
                throw new Error('Ritual Error: Received HTML instead of audio. The Echo has faded.');
            }

            // Step 2: Decode Audio
            set({ status: 'Interpreting the Waves...' });
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const float32Data = audioBuffer.getChannelData(0);

            worker.onmessage = (event) => {
                const { type, data } = event.data;
                switch (type) {
                    case 'STATUS':
                        set({ status: data });
                        break;
                    case 'DOWNLOAD_PROGRESS':
                        if (data.status === 'progress') {
                            set({ isDownloading: true, progress: data.progress });
                        } else if (data.status === 'ready' || data.status === 'done') {
                            set({ isDownloading: false, progress: 100 });
                        }
                        break;
                    case 'COMPLETE':
                        set({ isTranscribing: false, progress: 100, status: 'Ritual Complete', lastResult: data });
                        break;
                    case 'ERROR':
                        set({ isTranscribing: false, error: data });
                        break;
                }
            };

            worker.postMessage({
                type: 'TRANSCRIBE',
                data: { audio: float32Data }
            });

        } catch (error: any) {
            console.error('Transcription Store Error:', error);
            set({ isTranscribing: false, error: `Store Error: ${error.message}` });
        }
    },

    reset: () => set({ 
        isDownloading: false, 
        progress: 0, 
        isTranscribing: false, 
        status: '', 
        error: null,
        lastResult: null 
    }),
}));
