import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PixelButton } from './PixelButton';

describe('PixelButton', () => {
  it('renders children correctly', () => {
    render(<PixelButton>Click Me</PixelButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles onClick events', () => {
    const handleClick = vi.fn();
    render(<PixelButton onClick={handleClick}>Click Me</PixelButton>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies danger variant classes', () => {
    render(<PixelButton variant="danger">Delete</PixelButton>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-danger');
  });

  it('applies custom className', () => {
    render(<PixelButton className="custom-class">Custom</PixelButton>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });
});
