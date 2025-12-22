import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortableFolderItem } from './SortableFolderItem';
import { useSortable } from '@dnd-kit/sortable';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(),
}));

describe('SortableFolderItem', () => {
  it('renders children correctly', () => {
    vi.mocked(useSortable).mockReturnValue({
      attributes: { 'data-testid': 'attributes' } as any,
      listeners: { 'data-testid': 'listeners' } as any,
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    } as any);

    render(
      <SortableFolderItem id="folder-1">
        <div>Folder Content</div>
      </SortableFolderItem>
    );
    expect(screen.getByText('Folder Content')).toBeInTheDocument();
  });

  it('applies dragging styles when isDragging is true', () => {
    vi.mocked(useSortable).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: true,
    } as any);

    const { container } = render(
      <SortableFolderItem id="folder-1">
        <div>Folder Content</div>
      </SortableFolderItem>
    );
    
    const div = container.firstChild as HTMLElement;
    expect(div.style.opacity).toBe('0.3');
    expect(div.style.zIndex).toBe('10');
  });
});
