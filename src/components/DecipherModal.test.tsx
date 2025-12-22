import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DecipherModal } from './DecipherModal';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';

// Mock the store
vi.mock('../stores/useTranscriptionStore', () => ({
    useTranscriptionStore: vi.fn()
}));

describe('DecipherModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with "Preparing the Altar..." when status is empty', () => {
        (useTranscriptionStore as any).mockReturnValue({
            status: '',
            progress: 0,
            isDownloading: false,
            error: null
        });

        render(<DecipherModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Preparing the Altar...')).toBeInTheDocument();
    });

    it('renders the status from the store', () => {
        (useTranscriptionStore as any).mockReturnValue({
            status: 'Channeling the Oracle...',
            progress: 50,
            isDownloading: true,
            error: null
        });

        render(<DecipherModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Channeling the Oracle...')).toBeInTheDocument();
    });

    it('renders error message when ritual is interrupted', () => {
        (useTranscriptionStore as any).mockReturnValue({
            status: 'Reading the Echo...',
            progress: 0,
            isDownloading: false,
            error: 'Failed to invoke the Oracle'
        });

        render(<DecipherModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('Ritual Interrupted')).toBeInTheDocument();
        expect(screen.getByText('Failed to invoke the Oracle')).toBeInTheDocument();
    });
});
