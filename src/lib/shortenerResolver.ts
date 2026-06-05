export type ExpansionStatus = 'idle' | 'preview' | 'expanded' | 'blocked' | 'timeout';

export const EXPANSION_NETWORK_NOTICE =
  'Expanding a short link sends a request from this device to the shortener and may also contact redirected destinations your browser follows.';

export interface ExpansionResult {
  status: ExpansionStatus;
  previewUrl?: string;
  chain: string[];
  message: string;
}

export interface ExpandOptions {
  provider: string;
  previewUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 7000;

export async function expandShortLink(
  originalUrl: string,
  options: ExpandOptions
): Promise<ExpansionResult> {
  if (options.previewUrl) {
    return {
      status: 'preview',
      previewUrl: options.previewUrl,
      chain: [originalUrl],
      message: 'Open the provider preview to inspect the destination before visiting it.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher(originalUrl, {
      method: 'HEAD',
      redirect: 'follow',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal
    });

    if (response.redirected && response.url !== originalUrl) {
      return {
        status: 'expanded',
        chain: [originalUrl, response.url],
        message: 'Browser reported a redirected final URL.'
      };
    }

    return {
      status: 'blocked',
      chain: [originalUrl],
      message: 'No redirect target was observable from this browser.'
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        status: 'timeout',
        chain: [originalUrl],
        message: 'Short-link inspection timed out before a target could be observed.'
      };
    }

    return {
      status: 'blocked',
      chain: [originalUrl],
      message: 'This browser blocked short-link inspection or the provider did not allow it.'
    };
  } finally {
    clearTimeout(timeout);
  }
}
