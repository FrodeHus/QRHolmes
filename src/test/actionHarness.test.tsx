import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResultScreen from '../components/ResultScreen';

describe('ResultScreen actions', () => {
  const writeText = vi.fn<Clipboard['writeText']>();
  const open = vi.fn<typeof window.open>();

  beforeEach(() => {
    writeText.mockResolvedValue(undefined);
    open.mockReturnValue(null);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    vi.stubGlobal('open', open);
  });

  it('copies original value while displaying defanged value', async () => {
    render(<ResultScreen rawPayload="https://example.com/path" onScanAgain={() => {}} />);

    expect(screen.getByText('https[:]//example[.]com/path')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith('https://example.com/path');
  });

  it('copies raw scanned payload but opens normalized href', async () => {
    render(<ResultScreen rawPayload="  https://example.com/path  " onScanAgain={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^open$/i }));

    expect(writeText).toHaveBeenCalledWith('  https://example.com/path  ');
    expect(open).toHaveBeenCalledWith('https://example.com/path', '_blank', 'noopener,noreferrer');
  });
});
