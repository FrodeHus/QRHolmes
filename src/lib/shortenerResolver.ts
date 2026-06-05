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
const HEADER_EXPOSED_MESSAGE = 'Response headers exposed a destination URL.';
const PROVIDER_TARGET_HEADERS: Record<string, string[]> = {
  tinyurl: ['x-tinyurl-target'],
  'preview.tinyurl.com': ['x-tinyurl-target'],
  'tinyurl.com': ['x-tinyurl-target']
};

export async function expandShortLink(
  originalUrl: string,
  options: ExpandOptions
): Promise<ExpansionResult> {
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    if (options.previewUrl) {
      const previewResult = await inspectProviderPreview(originalUrl, options.previewUrl, fetcher, controller.signal);
      if (previewResult) {
        return previewResult;
      }
    }

    return await probeRedirect(originalUrl, fetcher, controller.signal);
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

async function inspectProviderPreview(
  originalUrl: string,
  previewUrl: string,
  fetcher: typeof fetch,
  signal: AbortSignal
): Promise<ExpansionResult | null> {
  try {
    const response = await fetcher(previewUrl, {
      method: 'HEAD',
      redirect: 'manual',
      mode: 'cors',
      cache: 'no-store',
      signal
    });
    const destination = getHeaderDestination(response.headers, originalUrl, previewUrl);

    if (destination) {
      return {
        status: 'expanded',
        chain: [originalUrl, destination],
        message: HEADER_EXPOSED_MESSAGE
      };
    }

    return null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return null;
  }
}

async function probeRedirect(
  originalUrl: string,
  fetcher: typeof fetch,
  signal: AbortSignal
): Promise<ExpansionResult> {
  const manualResponse = await fetcher(originalUrl, {
    method: 'HEAD',
    redirect: 'manual',
    mode: 'cors',
    cache: 'no-store',
    signal
  });
  const headerDestination = getHeaderDestination(manualResponse.headers, originalUrl, originalUrl);

  if (headerDestination) {
    return {
      status: 'expanded',
      chain: [originalUrl, headerDestination],
      message: HEADER_EXPOSED_MESSAGE
    };
  }

  const response = await fetcher(originalUrl, {
    method: 'HEAD',
    redirect: 'follow',
    mode: 'cors',
    cache: 'no-store',
    signal
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
}

function normalizeCandidateUrl(value: string, originalUrl: string, previewUrl: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === originalUrl || trimmed === previewUrl || trimmed.startsWith('#')) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, previewUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (parsed.toString() === originalUrl || parsed.toString() === previewUrl) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getHeaderDestination(headers: Headers, originalUrl: string, previewUrl: string): string | null {
  const names = [...providerHeaderNames(previewUrl), 'location'];
  for (const name of names) {
    const value = headers.get(name);
    if (!value) {
      continue;
    }
    const candidate = normalizeCandidateUrl(value, originalUrl, previewUrl);
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

function providerHeaderNames(previewUrl: string): string[] {
  try {
    const host = new URL(previewUrl).hostname.toLowerCase().replace(/^www\./, '');
    return PROVIDER_TARGET_HEADERS[host] ?? [];
  } catch {
    return [];
  }
}
