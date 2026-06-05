import { describe, expect, it, vi } from 'vitest';
import { EXPANSION_NETWORK_NOTICE, expandShortLink } from './shortenerResolver';

describe('EXPANSION_NETWORK_NOTICE', () => {
  it('discloses the outbound network behavior used for expansion', () => {
    expect(EXPANSION_NETWORK_NOTICE).toBe(
      'Expanding a short link sends a request from this device to the shortener and may also contact redirected destinations your browser follows.'
    );
  });
});

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

  it('probes with explicit HEAD redirect-follow fetch options', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      redirected: false,
      url: original
    } as Response);

    await expandShortLink(original, {
      provider: 'Bitly',
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      original,
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'follow',
        mode: 'cors',
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    );
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

  it('aborts an in-flight fetch after timeoutMs elapses', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn<typeof fetch>((_, init) => {
      signal = init?.signal ?? undefined;

      return new Promise<Response>((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    try {
      const result = expandShortLink(original, {
        provider: 'Bitly',
        fetcher,
        timeoutMs: 25
      });

      await vi.advanceTimersByTimeAsync(25);

      await expect(result).resolves.toEqual({
        status: 'timeout',
        chain: [original],
        message: 'Short-link inspection timed out before a target could be observed.'
      });
      expect(signal).toBeDefined();
      expect(signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
