import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PixelProgressBar } from './PixelProgressBar';

describe('PixelProgressBar', () => {
  it('renders correctly with given progress', () => {
    render(<PixelProgressBar progress={50} label="Testing" />);
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('clamps progress between 0 and 100', () => {
    const { rerender } = render(<PixelProgressBar progress={150} label="Testing" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '100%' });

    rerender(<PixelProgressBar progress={-50} label="Testing" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '0%' });
  });

  it('applies secondary color when specified', () => {
    render(<PixelProgressBar progress={50} label="Testing" color="secondary" />);
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveClass('bg-secondary');
  });
});
