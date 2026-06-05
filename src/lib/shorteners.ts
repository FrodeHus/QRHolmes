export type ShortenerStrategy = 'preview' | 'probe';

export interface ShortenerInfo {
  host: string;
  provider: string;
  previewUrl?: string;
  strategy: ShortenerStrategy;
}

const PROBE_PROVIDERS = new Map<string, string>([
  ['bit.ly', 'Bitly'],
  ['bitly.com', 'Bitly'],
  ['t.co', 't.co'],
  ['goo.gl', 'goo.gl'],
  ['ow.ly', 'ow.ly'],
  ['buff.ly', 'buff.ly'],
  ['cutt.ly', 'cutt.ly'],
  ['rebrand.ly', 'rebrand.ly'],
  ['lnkd.in', 'lnkd.in'],
  ['s.id', 's.id']
]);

export function getShortenerInfo(value: string): ShortenerInfo | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = normalizeHost(url.hostname);

  if (host === 'tinyurl.com') {
    return {
      host,
      provider: 'TinyURL',
      previewUrl: `${url.origin}/preview/${url.pathname.replace(/^\/+/, '')}`,
      strategy: 'preview'
    };
  }

  if (host === 'is.gd') {
    return {
      host,
      provider: 'is.gd',
      previewUrl: `${url.origin}${url.pathname}-`,
      strategy: 'preview'
    };
  }

  if (host === 'v.gd') {
    return {
      host,
      provider: 'v.gd',
      previewUrl: value,
      strategy: 'preview'
    };
  }

  const provider = PROBE_PROVIDERS.get(host);
  if (provider) {
    return {
      host,
      provider,
      strategy: 'probe'
    };
  }

  return null;
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}
