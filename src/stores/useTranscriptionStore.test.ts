import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTranscriptionStore } from './useTranscriptionStore';
import { act } from '@testing-library/react';

describe('useTranscriptionStore', () => {
    beforeEach(() => {
        act(() => {
            useTranscriptionStore.getState().reset();
        });
        vi.restoreAllMocks();
        vi.stubGlobal('Worker', vi.fn().mockImplementation(() => ({
            postMessage: vi.fn(),
            terminate: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            onmessage: null,
        })));
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
        let onMessageCallback: ((event: any) => void) | null = null;
        const postMessageMock = vi.fn();
        
        const MockWorker = vi.fn().mockImplementation(() => {
            const worker = {
                postMessage: postMessageMock,
                terminate: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                set onmessage(val: any) { onMessageCallback = val; },
                get onmessage() { return onMessageCallback; },
            };
            return worker;
        });

        vi.stubGlobal('Worker', MockWorker);

        const mockAudioBuffer = {
            getChannelData: vi.fn().mockReturnValue(new Float32Array(10))
        };

        const MockAudioContext = vi.fn().mockImplementation(() => ({
            decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
            close: vi.fn(),
        }));

        vi.stubGlobal('AudioContext', MockAudioContext);
        
        const mockBlob = new Blob(['dummy audio content'], { type: 'audio/wav' });
        
        let transcribePromise: Promise<void>;
        await act(async () => {
            transcribePromise = useTranscriptionStore.getState().transcribe(mockBlob);
        });
        
        expect(useTranscriptionStore.getState().isTranscribing).toBe(true);
        expect(useTranscriptionStore.getState().step).toBe('processing'); // Initially set to preparing then processing
        expect(postMessageMock).toHaveBeenCalled();
        
        // Simulate worker complete
        await act(async () => {
            if (onMessageCallback) {
                (onMessageCallback as any)({ data: { type: 'COMPLETE', data: 'Deciphered text' } });
            }
        });
        
        await transcribePromise!;
        
        expect(useTranscriptionStore.getState().isTranscribing).toBe(false);
        expect(useTranscriptionStore.getState().step).toBe('complete');
        expect(useTranscriptionStore.getState().lastResult).toBe('Deciphered text');
    });
});