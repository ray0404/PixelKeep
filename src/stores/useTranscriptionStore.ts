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
    activeNoteId: number | null;
    
    setDownloading: (isDownloading: boolean) => void;
    setProgress: (progress: number) => void;
    setTranscribing: (isTranscribing: boolean) => void;
    setStatus: (status: string) => void;
    setError: (error: string | null) => void;
    transcribe: (audioBlob: Blob, noteId?: number) => Promise<void>;
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
    activeNoteId: null,

    setDownloading: (isDownloading) => set({ isDownloading }),
    setProgress: (progress) => set({ progress }),
    setTranscribing: (isTranscribing) => set({ isTranscribing }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),

    transcribe: async (audioBlob, noteId) => {
        // Concurrency Check
        if (get().isTranscribing) {
            alert("The Oracle can only focus on one ritual at a time.");
            return;
        }

        clearProgressInterval();
        set({ isTranscribing: true, activeNoteId: noteId || null, step: 'preparing', status: 'Preparing the Altar...', lastResult: null, error: null });
        try {
            if (!worker) {
                worker = new TranscriptionWorker();
            }

            // Step 1: Decode Audio (No more fetching!)
            set({ status: 'Interpreting the Waves...', step: 'processing', progress: 10 });
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // First decode at system rate to get duration and data
            const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);

            // Then resample to 16000Hz (Required by Whisper) using OfflineAudioContext
            const offlineCtx = new OfflineAudioContext(1, decodedBuffer.duration * 16000, 16000);
            const source = offlineCtx.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(offlineCtx.destination);
            source.start();
            
            const resampledBuffer = await offlineCtx.startRendering();
            let float32Data = resampledBuffer.getChannelData(0);
            
            // Clean up temp context
            tempCtx.close();

            // VAD Optimization: Trim Silence
            // Find start
            const threshold = 0.015;
            let startIndex = 0;
            let endIndex = float32Data.length;

            for (let i = 0; i < float32Data.length; i++) {
                if (Math.abs(float32Data[i]) > threshold) {
                    startIndex = i;
                    break;
                }
            }

            // Find end
            for (let i = float32Data.length - 1; i >= 0; i--) {
                if (Math.abs(float32Data[i]) > threshold) {
                    endIndex = i + 1; // +1 to include the sample
                    break;
                }
            }

            // Apply trim if we found valid audio
            if (startIndex < endIndex) {
                 const originalDuration = float32Data.length;
                 float32Data = float32Data.slice(startIndex, endIndex);
                 console.log(`VAD: Trimmed ${(originalDuration - float32Data.length) / 16000}s of silence.`);
            }

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
            lastResult: null,
            activeNoteId: null
        });
    },
}));
