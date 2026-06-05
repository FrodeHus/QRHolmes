import type { ParsedPayload } from '../types';

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

export function parsePayload(raw: string): ParsedPayload {
  const original = raw.trim();

  if (original.toUpperCase().startsWith('WIFI:')) {
    return parseWifi(original);
  }

  if (original.toLowerCase().startsWith('mailto:')) {
    return parseMailto(original);
  }

  if (original.toLowerCase().startsWith('tel:')) {
    return {
      type: 'telephone',
      original,
      href: original,
      number: original.slice(4)
    };
  }

  if (original.toLowerCase().startsWith('sms:') || original.toLowerCase().startsWith('smsto:')) {
    return parseSms(original);
  }

  const scheme = original.match(SCHEME_RE)?.[1]?.toLowerCase();
  if (scheme) {
    if (scheme !== 'http' && scheme !== 'https' && /\s/.test(original.slice(scheme.length + 1))) {
      return { type: 'deep-link', original, href: original, scheme };
    }

    try {
      const parsed = new URL(original);
      return {
        type: scheme === 'http' || scheme === 'https' ? 'url' : 'deep-link',
        original,
        href: original,
        scheme,
        host: parsed.hostname || undefined,
        path: parsed.pathname || undefined,
        search: parsed.search || undefined
      };
    } catch {
      return { type: 'deep-link', original, href: original, scheme };
    }
  }

  return { type: 'text', original, text: original };
}

function parseWifi(original: string): ParsedPayload {
  const body = original.slice(5).replace(/;;$/, '');
  const fields = new Map<string, string>();

  for (const segment of splitWifiFields(body)) {
    const index = segment.indexOf(':');
    if (index > -1) {
      fields.set(segment.slice(0, index).toUpperCase(), unescapeWifi(segment.slice(index + 1)));
    }
  }

  return {
    type: 'wifi',
    original,
    encryption: fields.get('T') || undefined,
    ssid: fields.get('S') || undefined,
    password: fields.get('P') || undefined,
    hidden: fields.get('H')?.toLowerCase() === 'true'
  };
}

function splitWifiFields(body: string): string[] {
  const fields: string[] = [];
  let field = '';
  let escaped = false;

  for (const character of body) {
    if (escaped) {
      field += `\\${character}`;
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === ';') {
      fields.push(field);
      field = '';
      continue;
    }

    field += character;
  }

  fields.push(escaped ? `${field}\\` : field);
  return fields;
}

function unescapeWifi(value: string): string {
  return value.replace(/\\([\\;,:"])/g, '$1');
}

function parseMailto(original: string): ParsedPayload {
  const parsed = new URL(original);
  return {
    type: 'email',
    original,
    href: original,
    address: decodeURIComponent(parsed.pathname),
    subject: parsed.searchParams.get('subject') || undefined,
    body: parsed.searchParams.get('body') || undefined
  };
}

function parseSms(original: string): ParsedPayload {
  const schemeEnd = original.indexOf(':');
  const rest = original.slice(schemeEnd + 1);
  const scheme = original.slice(0, schemeEnd).toLowerCase();

  if (scheme === 'smsto') {
    const bodyStart = rest.indexOf(':');
    return {
      type: 'sms',
      original,
      href: original,
      number: bodyStart === -1 ? rest : rest.slice(0, bodyStart),
      body: bodyStart === -1 ? undefined : rest.slice(bodyStart + 1) || undefined
    };
  }

  const [number, query = ''] = rest.split('?');
  const params = new URLSearchParams(query);
  return {
    type: 'sms',
    original,
    href: original,
    number,
    body: params.get('body') || undefined
  };
}
