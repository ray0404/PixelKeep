import { describe, it, expect, beforeEach } from 'vitest';
import { useTranscriptionStore } from './useTranscriptionStore';

describe('useTranscriptionStore', () => {
    beforeEach(() => {
        useTranscriptionStore.getState().reset();
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
});
