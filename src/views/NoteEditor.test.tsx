import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
vi.mock('../stores/useNoteStore', () => ({
  useNoteStore: vi.fn(() => ({
    notes: [],
    addNote: vi.fn(),
    updateNote: vi.fn(),
    saveAsset: vi.fn(),
    getAsset: vi.fn().mockResolvedValue(null)
  }))
}));

vi.mock('../stores/useFolderStore', () => ({
  useFolderStore: vi.fn(() => ({
    currentFolderId: 'root'
  }))
}));

vi.mock('../stores/useTranscriptionStore', () => ({
  useTranscriptionStore: vi.fn(() => ({
    isDownloading: false,
    progress: 0,
    isTranscribing: false,
    status: '',
    step: 'idle',
    error: null,
    lastResult: null,
    transcribe: vi.fn(),
    reset: vi.fn()
  }))
}));

// Mock hooks
vi.mock('../hooks/useAudioRecorder', () => ({
  useAudioRecorder: vi.fn(() => ({
    isRecording: false,
    audioUrl: null,
    audioBlob: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    clearAudio: vi.fn(),
    setAudioUrl: vi.fn(),
    setAudioBlob: vi.fn()
  }))
}));

describe('NoteEditor', () => {
  it('updates title input correctly', () => {
    render(
      <MemoryRouter>
        <NoteEditor />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Enter Title...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Scroll' } });
    expect(input.value).toBe('New Scroll');
  });

  it('updates tags input correctly', () => {
    render(
      <MemoryRouter>
        <NoteEditor />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('gamedev, ideas, etc...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'tag1, tag2' } });
    expect(input.value).toBe('tag1, tag2');
  });
});
