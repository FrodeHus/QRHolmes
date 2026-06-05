import { describe, expect, it, vi } from 'vitest';
import { expandShortLink } from './shortenerResolver';

describe('expandShortLink', () => {
  const original = 'https://bit.ly/example';

  it('returns a provider preview without calling the fetcher', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      expandShortLink(original, {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/example',
        fetcher
      })
    ).resolves.toEqual({
      status: 'preview',
      previewUrl: 'https://tinyurl.com/preview/example',
      chain: [original],
      message: 'Open the provider preview to inspect the destination before visiting it.'
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns an expanded chain when the browser reports a redirected final URL', async () => {
    const finalUrl = 'https://example.com/final';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      redirected: true,
      url: finalUrl
    } as Response);

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toEqual({
      status: 'expanded',
      chain: [original, finalUrl],
      message: 'Browser reported a redirected final URL.'
    });
  });

  it('returns blocked when browser fetch rejects', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toMatchObject({
      status: 'blocked',
      chain: [original]
    });
  });

  it('returns timeout when browser fetch aborts', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toMatchObject({
      status: 'timeout',
      chain: [original]
    });
  });
});
