import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTranscriptionStore } from './useTranscriptionStore';
import { act } from '@testing-library/react';

describe('useTranscriptionStore', () => {
    beforeEach(() => {
        act(() => {
            useTranscriptionStore.getState().reset();
        });
        vi.restoreAllMocks();
    });

    it('should initialize with default values', () => {
        const state = useTranscriptionStore.getState();
        expect(state.isDownloading).toBe(false);
        expect(state.progress).toBe(0);
        expect(state.isTranscribing).toBe(false);
        expect(state.status).toBe('');
        expect(state.error).toBe(null);
    });

    it('should update status message', () => {
        useTranscriptionStore.getState().setStatus('Channeling...');
        expect(useTranscriptionStore.getState().status).toBe('Channeling...');
    });

    it('should update downloading state', () => {
        useTranscriptionStore.getState().setDownloading(true);
        expect(useTranscriptionStore.getState().isDownloading).toBe(true);
    });

    it('should update progress', () => {
        useTranscriptionStore.getState().setProgress(50);
        expect(useTranscriptionStore.getState().progress).toBe(50);
    });

    it('should update transcribing state', () => {
        useTranscriptionStore.getState().setTranscribing(true);
        expect(useTranscriptionStore.getState().isTranscribing).toBe(true);
    });

    it('should set error', () => {
        useTranscriptionStore.getState().setError('Failed');
        expect(useTranscriptionStore.getState().error).toBe('Failed');
    });

    it('should reset state', () => {
        const store = useTranscriptionStore.getState();
        store.setDownloading(true);
        store.setProgress(100);
        store.reset();
        
        const state = useTranscriptionStore.getState();
        expect(state.isDownloading).toBe(false);
        expect(state.progress).toBe(0);
    });

        it('should handle transcribe flow', async () => {

            // Mock global objects

            const workerInstance = {

                postMessage: vi.fn(),

                onmessage: null as any,

                terminate: vi.fn()

            };

            

            class MockWorker {

                postMessage = workerInstance.postMessage;

                terminate = workerInstance.terminate;

                set onmessage(val: any) { workerInstance.onmessage = val; }

                get onmessage() { return workerInstance.onmessage; }

                addEventListener = vi.fn();

            }

    

                    vi.stubGlobal('Worker', MockWorker);

    

                    

    

                                        class MockURL {

    

                    

    

                                            href = 'mock-url';

    

                    

    

                                            constructor(_url: string | URL, _base?: string | URL) {}

    

                    

    

                                        }

    

                    vi.stubGlobal('URL', MockURL);

    

            

            

            const mockAudioBuffer = {

                getChannelData: vi.fn().mockReturnValue(new Float32Array(10))

            };

    

            class MockAudioContext {

                decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer);

                close = vi.fn();

            }

    

            vi.stubGlobal('AudioContext', MockAudioContext);

            

                        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({

            

                            ok: true,

            

                            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),

            

                            headers: { get: vi.fn().mockReturnValue('audio/mpeg') }

            

                        }));

    

            let transcribePromise: Promise<void>;

                    act(() => {

                        transcribePromise = useTranscriptionStore.getState().transcribe('test-url');

                    });

                    

                    expect(useTranscriptionStore.getState().error).toBe(null);

                    expect(useTranscriptionStore.getState().isTranscribing).toBe(true);

                    

                    // Wait for microtasks so worker.onmessage is assigned

                    await new Promise(resolve => setTimeout(resolve, 0));

            

                    // Simulate worker complete

                    act(() => {

                        if (workerInstance.onmessage) {

                            workerInstance.onmessage({ data: { type: 'COMPLETE', data: 'Deciphered text' } });

                        }

                    });

            

            

            await act(async () => {

                await transcribePromise!;

            });

            

            expect(useTranscriptionStore.getState().isTranscribing).toBe(false);

            expect(useTranscriptionStore.getState().lastResult).toBe('Deciphered text');

        });

    
});
