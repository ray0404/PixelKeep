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
      setSearchQuery: vi.fn(),
      getAsset: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'audio/mpeg' }))
    });
    (useSettingsStore as any).mockReturnValue({
      includeTitleInCopy: true,
      textColor: '#ffffff'
    });
    (useTranscriptionStore as any).mockReturnValue({
        setDownloading: vi.fn(),
        reset: vi.fn()
    });
    
    // Set a resolvedAudioBlob by making the note audio an asset path
    mockNote.audio = 'asset:test-audio';

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

  it('renders audio player if audio exists', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('note-audio-player')).toBeInTheDocument();
  });

  it('renders "DECIPHER ECHO" button if audio exists', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/DECIPHER ECHO/i)).toBeInTheDocument();
  });

  it('shows permission modal on first decipher click', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const button = await screen.findByText(/DECIPHER ECHO/i);
    fireEvent.click(button);

    expect(await screen.findByText(/Invoke the Oracle/i)).toBeInTheDocument();
  });

  it('shows progress bar when transcribing this note', async () => {
    (useTranscriptionStore as any).mockReturnValue({
        isTranscribing: true,
        activeNoteId: 1,
        progress: 50,
        status: 'Reading...',
        reset: vi.fn(),
        transcribe: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/DECIPHERING ECHO/i)).toBeInTheDocument();
    expect(await screen.findByText(/Reading.../i)).toBeInTheDocument();
  });
});
