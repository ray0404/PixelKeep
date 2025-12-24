import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PixelToast } from './PixelToast';
import { MemoryRouter } from 'react-router-dom';
import { useTranscriptionStore } from '../../stores/useTranscriptionStore';

// Mock store
vi.mock('../../stores/useTranscriptionStore');

describe('PixelToast', () => {
    it('should not render when step is not complete', () => {
        vi.mocked(useTranscriptionStore).mockReturnValue({
            step: 'idle',
            activeNoteId: null,
            reset: vi.fn(),
        } as any);

        render(<PixelToast />);
        expect(screen.queryByText('RITUAL COMPLETE!')).not.toBeInTheDocument();
    });

    it('should render when step is complete', () => {
        vi.mocked(useTranscriptionStore).mockReturnValue({
            step: 'complete',
            activeNoteId: 123,
            reset: vi.fn(),
        } as any);

        render(
            <MemoryRouter>
                <PixelToast />
            </MemoryRouter>
        );
        expect(screen.getByText('RITUAL COMPLETE!')).toBeInTheDocument();
        expect(screen.getByText('GO TO SCROLL')).toBeInTheDocument();
    });

    it('should call reset when closed', () => {
        const resetMock = vi.fn();
        vi.mocked(useTranscriptionStore).mockReturnValue({
            step: 'complete',
            activeNoteId: null,
            reset: resetMock,
        } as any);

        render(<PixelToast />);
        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);
        expect(resetMock).toHaveBeenCalled();
    });
});
