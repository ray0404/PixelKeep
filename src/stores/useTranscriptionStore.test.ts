import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTranscriptionStore } from './useTranscriptionStore';
import { act } from '@testing-library/react';

// Define mocks outside to be used in the factory if needed, 
// but since we need to access them in tests, we'll attach them to the class or a global object.
// Better yet, we can use a singleton pattern for the mock worker to access it in tests.

const WorkerMock = {
    postMessage: vi.fn(),
    onmessage: null as ((event: any) => void) | null,
};

// Mock the worker import
vi.mock('../workers/transcription.worker.ts?worker', () => {
    return {
        default: class MockWorker {
            constructor() {
                // Reset on instantiation if needed, or keep shared state
            }
            postMessage(data: any, transfer: any[]) {
                WorkerMock.postMessage(data, transfer);
            }
            terminate() {}
            addEventListener() {}
            removeEventListener() {}
            set onmessage(val: any) { WorkerMock.onmessage = val; }
            get onmessage() { return WorkerMock.onmessage; }
        }
    };
});

describe('useTranscriptionStore', () => {
    beforeEach(() => {
        act(() => {
            useTranscriptionStore.getState().reset();
        });
        vi.restoreAllMocks();
        WorkerMock.postMessage = vi.fn();
        WorkerMock.onmessage = null;

        // Mock AudioContext
        const mockAudioBuffer = {
            duration: 1,
            getChannelData: vi.fn().mockReturnValue(new Float32Array(10))
        };

        vi.stubGlobal('AudioContext', class {
            decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer);
            close = vi.fn();
        });

        vi.stubGlobal('webkitAudioContext', class {
            decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer);
            close = vi.fn();
        });

        // Mock OfflineAudioContext
        const mockResampledBuffer = {
             getChannelData: vi.fn().mockReturnValue(new Float32Array(10))
        };
        
        vi.stubGlobal('OfflineAudioContext', class {
            constructor() {}
            createBufferSource = vi.fn().mockReturnValue({
                buffer: null,
                connect: vi.fn(),
                start: vi.fn(),
            });
            startRendering = vi.fn().mockResolvedValue(mockResampledBuffer);
            destination = {};
        });
    });
    
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should initialize with default values', () => {
        const state = useTranscriptionStore.getState();
        expect(state.isDownloading).toBe(false);
        expect(state.progress).toBe(0);
        expect(state.isTranscribing).toBe(false);
        expect(state.status).toBe('');
        expect(state.step).toBe('idle');
        expect(state.error).toBe(null);
    });

    it('should reset state', () => {
        const store = useTranscriptionStore.getState();
        act(() => {
            store.setDownloading(true);
            store.setProgress(100);
            store.reset();
        });
        
        const state = useTranscriptionStore.getState();
        expect(state.isDownloading).toBe(false);
        expect(state.progress).toBe(0);
        expect(state.step).toBe('idle');
    });

    it('should handle transcribe flow', async () => {
        const mockBlob = new Blob(['dummy audio content'], { type: 'audio/wav' });
        mockBlob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
        
        let transcribePromise: Promise<void>;
        await act(async () => {
            transcribePromise = useTranscriptionStore.getState().transcribe(mockBlob);
        });
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(useTranscriptionStore.getState().isTranscribing).toBe(true);
        expect(['preparing', 'processing']).toContain(useTranscriptionStore.getState().step);
        
        expect(WorkerMock.postMessage).toHaveBeenCalled();
        
        // Simulate worker complete
        await act(async () => {
            if (WorkerMock.onmessage) {
                WorkerMock.onmessage({ data: { type: 'COMPLETE', data: 'Deciphered text' } });
            }
        });
        
        await transcribePromise!;
        
        expect(useTranscriptionStore.getState().isTranscribing).toBe(false);
        expect(useTranscriptionStore.getState().step).toBe('complete');
        expect(useTranscriptionStore.getState().lastResult).toBe('Deciphered text');
    });
});