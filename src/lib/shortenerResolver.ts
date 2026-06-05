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
const PREVIEW_EXPOSED_MESSAGE = 'Provider preview exposed a destination URL.';
const STATIC_ASSET_PATH_RE = /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot|json|xml|txt)$/i;

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
      method: 'GET',
      redirect: 'follow',
      mode: 'cors',
      cache: 'no-store',
      signal
    });
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    const body = await response.text();
    const destination = contentType.includes('json')
      ? extractUrlFromJson(body, originalUrl, previewUrl)
      : extractUrlFromHtml(body, originalUrl, previewUrl);

    if (destination) {
      return {
        status: 'expanded',
        chain: [originalUrl, destination],
        message: PREVIEW_EXPOSED_MESSAGE
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

function extractUrlFromJson(body: string, originalUrl: string, previewUrl: string): string | null {
  try {
    return findUrlInValue(JSON.parse(body), originalUrl, previewUrl);
  } catch {
    return extractUrlFromHtml(body, originalUrl, previewUrl);
  }
}

function findUrlInValue(value: unknown, originalUrl: string, previewUrl: string): string | null {
  if (typeof value === 'string') {
    return normalizeCandidateUrl(value, originalUrl, previewUrl);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findUrlInValue(item, originalUrl, previewUrl);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const candidate = findUrlInValue(item, originalUrl, previewUrl);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function extractUrlFromHtml(body: string, originalUrl: string, previewUrl: string): string | null {
  const hrefMatches = body.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi);
  for (const match of hrefMatches) {
    const candidate = normalizeCandidateUrl(decodeHtmlEntities(match[1]), originalUrl, previewUrl);
    if (candidate) {
      return candidate;
    }
  }

  const urlMatches = body.matchAll(/https?:\/\/[^\s"'<>]+/gi);
  for (const match of urlMatches) {
    const candidate = normalizeCandidateUrl(decodeHtmlEntities(match[0]), originalUrl, previewUrl);
    if (candidate) {
      return candidate;
    }
  }

  return null;
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
    if (isPreviewPageAsset(parsed, previewUrl)) {
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

function isPreviewPageAsset(parsed: URL, previewUrl: string): boolean {
  const preview = new URL(previewUrl);
  return parsed.origin === preview.origin && STATIC_ASSET_PATH_RE.test(parsed.pathname);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}
