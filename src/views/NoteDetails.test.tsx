import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteDetails } from './NoteDetails';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock stores
vi.mock('../stores/useNoteStore', () => ({
  useNoteStore: vi.fn()
}));

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn()
}));

vi.mock('../stores/useTranscriptionStore', () => ({
    useTranscriptionStore: vi.fn()
}));

const mockNote = {
  id: 1,
  title: 'Test Note',
  content: 'Test content',
  tags: ['test'],
  audio: 'blob:http://localhost:3000/123',
  updatedAt: new Date().toISOString()
};

describe('NoteDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNoteStore as any).mockReturnValue({
      notes: [mockNote],
      setSearchQuery: vi.fn()
    });
    (useSettingsStore as any).mockReturnValue({
      includeTitleInCopy: true,
      textColor: '#ffffff'
    });
    (useTranscriptionStore as any).mockReturnValue({
        setDownloading: vi.fn(),
        reset: vi.fn()
    });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders audio player if audio exists', () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('note-audio-player')).toBeInTheDocument();
  });

  it('renders "DECIPHER ECHO" button if audio exists', () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/DECIPHER ECHO/i)).toBeInTheDocument();
  });

  it('shows permission modal on first decipher click', () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const button = screen.getByText(/DECIPHER ECHO/i);
    fireEvent.click(button);

    expect(screen.getByText(/Invoke the Oracle/i)).toBeInTheDocument();
  });
});
