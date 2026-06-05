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

  it('extracts TinyURL destination from the provider target header', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: { 'x-tinyurl-target': 'https://example.com/final' }
      })
    );

    await expect(
      expandShortLink(original, {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/example',
        fetcher
      })
    ).resolves.toMatchObject({
      status: 'expanded',
      chain: [original, 'https://example.com/final'],
      message: 'Response headers exposed a destination URL.'
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://tinyurl.com/preview/example',
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'manual',
        mode: 'cors',
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('extracts a destination from a Location header when exposed', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: { location: 'https://example.com/from-location' }
      })
    );

    await expect(
      expandShortLink(original, {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/example',
        fetcher
      })
    ).resolves.toEqual({
      status: 'expanded',
      chain: [original, 'https://example.com/from-location'],
      message: 'Response headers exposed a destination URL.'
    });
  });

  it('does not scrape provider preview HTML assets as destinations', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          '<link href="/css/front.css?id=8a2a22d4fdd8f71cdf8183d3a6e5a956" rel="stylesheet">',
          {
            headers: { 'content-type': 'text/html' }
          }
        )
      )
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce({
        redirected: true,
        url: 'https://example.com/head-final'
      } as Response);

    await expect(
      expandShortLink('https://tinyurl.com/nmc5z44b', {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/nmc5z44b',
        fetcher
      })
    ).resolves.toEqual({
      status: 'expanded',
      chain: ['https://tinyurl.com/nmc5z44b', 'https://example.com/head-final'],
      message: 'Browser reported a redirected final URL.'
    });
  });

  it('falls back to HEAD probing when provider preview headers expose no destination', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null)
      )
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce({
        redirected: true,
        url: 'https://example.com/head-final'
      } as Response);

    await expect(
      expandShortLink(original, {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/example',
        fetcher
      })
    ).resolves.toEqual({
      status: 'expanded',
      chain: [original, 'https://example.com/head-final'],
      message: 'Browser reported a redirected final URL.'
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('extracts a destination from the original short URL Location header', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: { location: 'https://example.com/manual-location' }
      })
    );

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toEqual({
      status: 'expanded',
      chain: [original, 'https://example.com/manual-location'],
      message: 'Response headers exposed a destination URL.'
    });
    expect(fetcher).toHaveBeenCalledWith(
      original,
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'manual',
        mode: 'cors',
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('returns an expanded chain when the browser reports a redirected final URL', async () => {
    const finalUrl = 'https://example.com/final';
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce({
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
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce({
        redirected: false,
        url: original
      } as Response);

    await expandShortLink(original, {
      provider: 'Bitly',
      fetcher
    });

    expect(fetcher).toHaveBeenLastCalledWith(
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
