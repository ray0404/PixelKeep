import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteItem } from './NoteItem';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';

vi.mock('../stores/useNoteStore', () => ({
  useNoteStore: vi.fn(() => ({
    setSearchQuery: vi.fn()
  }))
}));

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    includeTitleInCopy: false
  }))
}));

vi.mock('../stores/useTranscriptionStore');

const mockNote = {
  id: 1,
  title: 'Test Note',
  content: 'Content',
  tags: [],
  updatedAt: new Date().toISOString(),
  order: 1
};

describe('NoteItem', () => {
  it('renders title', () => {
    vi.mocked(useTranscriptionStore).mockReturnValue({
        isTranscribing: false,
        activeNoteId: null
    } as any);

    render(
      <NoteItem 
        note={mockNote} 
        nodeId="note-1" 
        onView={vi.fn()} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    expect(screen.getByText('Test Note')).toBeDefined();
  });

  it('shows spinner when transcribing', () => {
    vi.mocked(useTranscriptionStore).mockReturnValue({
        isTranscribing: true,
        activeNoteId: 1
    } as any);

    render(
      <NoteItem 
        note={mockNote} 
        nodeId="note-1" 
        onView={vi.fn()} 
        onEdit={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    expect(screen.getByText('refresh')).toBeDefined();
  });
});
