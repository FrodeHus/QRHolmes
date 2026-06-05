import { describe, expect, it, vi } from 'vitest';
import { EXPANSION_NETWORK_NOTICE, expandShortLink } from './shortenerResolver';

describe('EXPANSION_NETWORK_NOTICE', () => {
  it('discloses the outbound network behavior used for expansion', () => {
    expect(EXPANSION_NETWORK_NOTICE).toBe(
      'Expanding a short link sends a HEAD request from this device to the shortener and inspects exposed response headers.'
    );
  });
});

describe('expandShortLink', () => {
  const original = 'https://bit.ly/example';

  it('extracts TinyURL destination from the provider target header', async () => {
    const tinyUrl = 'https://tinyurl.com/example';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: { 'x-tinyurl-target': 'https://example.com/final' }
      })
    );

    await expect(
      expandShortLink(tinyUrl, {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/example',
        fetcher
      })
    ).resolves.toMatchObject({
      status: 'expanded',
      chain: [tinyUrl, 'https://example.com/final'],
      message: 'Response headers exposed a destination URL.'
    });
    expect(fetcher).toHaveBeenCalledWith(
      tinyUrl,
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'manual',
        mode: 'cors',
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('does not use Location headers as client-side expansion targets', async () => {
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
      status: 'blocked',
      chain: [original],
      message: 'No provider target header was observable from this browser.'
    });
  });

  it('does not inspect provider preview HTML assets as destinations', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(new Response(null, {
        headers: { location: 'https://tinyurl.com/css/front.css?id=8a2a22d4fdd8f71cdf8183d3a6e5a956' }
      }));

    await expect(
      expandShortLink('https://tinyurl.com/nmc5z44b', {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/nmc5z44b',
        fetcher
      })
    ).resolves.toEqual({
      status: 'blocked',
      chain: ['https://tinyurl.com/nmc5z44b'],
      message: 'No provider target header was observable from this browser.'
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not follow redirects when response headers expose no destination', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null)
      )
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
      status: 'blocked',
      chain: [original],
      message: 'No provider target header was observable from this browser.'
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
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

  it('reports when a redirect response hides its Location header from JavaScript', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(null, {
        status: 301
      })
    );

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toEqual({
      status: 'blocked',
      chain: [original],
      message: 'A redirect response was observed, but the destination header is not available to client-side JavaScript.'
    });
  });

  it('reports when a manual redirect response is opaque to JavaScript', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce({
      headers: new Headers(),
      type: 'opaqueredirect'
    } as Response);

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toEqual({
      status: 'blocked',
      chain: [original],
      message: 'A redirect response was observed, but the destination header is not available to client-side JavaScript.'
    });
  });

  it('reports redirects with ignored Location headers as hidden destinations', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 301,
        headers: { location: 'https://example.com/manual-location' }
      })
    );

    await expect(
      expandShortLink(original, {
        provider: 'Bitly',
        fetcher
      })
    ).resolves.toEqual({
      status: 'blocked',
      chain: [original],
      message: 'A redirect response was observed, but the destination header is not available to client-side JavaScript.'
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

  it('probes with explicit HEAD manual redirect options', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null));

    await expandShortLink(original, {
      provider: 'Bitly',
      fetcher
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
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
