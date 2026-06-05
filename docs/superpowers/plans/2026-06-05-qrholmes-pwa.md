# QRHolmes PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build QRHolmes as a static, installable Vite PWA for local QR inspection with explicit outbound actions only.

**Architecture:** Use a React + TypeScript Vite app with isolated domain modules for payload parsing, defanging, shortener detection, expansion state, and user actions. Keep camera scanning and UI components separate from behavior modules so core inspection rules are unit-testable without camera access.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, `vite-plugin-pwa`, `jsqr`, browser Clipboard/MediaDevices APIs, static public assets.

---

## File Structure

- Create `package.json`: npm scripts and dependencies for Vite, React, Vitest, PWA generation, QR decoding, and icon generation.
- Create `index.html`: Vite entrypoint and PWA metadata.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.setup.ts`: TypeScript, build, PWA, and test configuration.
- Create `src/main.tsx`: React bootstrap.
- Create `src/App.tsx`: client-side screen state for home, scanner, result, and privacy/settings view.
- Create `src/styles.css`: responsive app styling.
- Create `src/types.ts`: shared domain types.
- Create `src/lib/defangUrl.ts`: defanged display helpers.
- Create `src/lib/parsePayload.ts`: QR payload classification and parsed details.
- Create `src/lib/shorteners.ts`: known shortener detection and preview URL behavior.
- Create `src/lib/shortenerResolver.ts`: explicit expansion state machine around fetch behavior.
- Create `src/lib/actions.ts`: copy/open action helpers that use original payload values.
- Create `src/components/LogoHeader.tsx`: logo and top app identity.
- Create `src/components/HomeScreen.tsx`: initial screen with large inspect button.
- Create `src/components/ScannerScreen.tsx`: camera setup, canvas frame capture, QR decoding, permission/error states.
- Create `src/components/ResultScreen.tsx`: defanged display, parsed details, short-link expansion controls, copy/open actions.
- Create `src/components/PrivacyScreen.tsx`: concise privacy and outbound action disclosure.
- Create `src/components/ActionBar.tsx`: bottom action buttons.
- Create `src/components/ParsedDetails.tsx`: type-specific parsed details.
- Create `src/components/ShortLinkPanel.tsx`: expansion UI.
- Create `src/test/actionHarness.test.tsx`: action behavior tests for original values.
- Create `src/lib/*.test.ts`: unit tests for parser, defanger, shorteners, and resolver.
- Create `scripts/generate-icons.mjs`: generate PWA icons from root `qrholmes.png`.
- Create `public/manifest.webmanifest`, `public/robots.txt`, generated icons in `public/icons/`: static PWA assets.

## Task 1: Scaffold Vite React TypeScript Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create package metadata and scripts**

Write `package.json`:

```json
{
  "name": "qrholmes",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --noEmit",
    "icons": "node scripts/generate-icons.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "jsqr": "^1.4.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "vite": "^7.0.0",
    "vite-plugin-pwa": "^1.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "sharp": "^0.34.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create Vite HTML entrypoint**

Write `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#10231f" />
    <meta name="description" content="QRHolmes inspects QR code contents locally in your browser." />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/icons/icon-192.png" />
    <title>QRHolmes</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript and Vite config**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Write `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Write `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'robots.txt'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true
  }
});
```

Write `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create temporary React shell**

Write `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Write `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>QRHolmes</h1>
      <p>Inspect QR code contents locally.</p>
    </main>
  );
}
```

Write `src/styles.css`:

```css
:root {
  color: #16201d;
  background: #f5f7f4;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #f5f7f4;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px 20px;
}
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and install exits with code 0.

- [ ] **Step 6: Verify scaffold builds**

Run: `npm run build`

Expected: build exits with code 0 and creates `dist/`.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.setup.ts src/main.tsx src/App.tsx src/styles.css
git commit -m "Scaffold QRHolmes Vite PWA"
```

## Task 2: Implement Defanging

**Files:**
- Create: `src/lib/defangUrl.test.ts`
- Create: `src/lib/defangUrl.ts`

- [ ] **Step 1: Write failing defanger tests**

Write `src/lib/defangUrl.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defangText, defangUrl } from './defangUrl';

describe('defangUrl', () => {
  it('defangs protocol separator and host dots', () => {
    expect(defangUrl('https://example.com/path?q=1')).toBe('https[:]//example[.]com/path?q=1');
  });

  it('defangs subdomains and leaves path punctuation readable', () => {
    expect(defangUrl('http://a.b.example.co.uk/login')).toBe('http[:]//a[.]b[.]example[.]co[.]uk/login');
  });

  it('defangs IPv4 address dots', () => {
    expect(defangUrl('http://192.168.0.1/admin')).toBe('http[:]//192[.]168[.]0[.]1/admin');
  });

  it('falls back to defanging all dots in invalid URL-like text', () => {
    expect(defangUrl('https://not a url.test')).toBe('https[:]//not a url[.]test');
  });
});

describe('defangText', () => {
  it('defangs URL-like protocols inside arbitrary text', () => {
    expect(defangText('Visit https://example.com now')).toBe('Visit https[:]//example[.]com now');
  });

  it('defangs plain domains inside arbitrary text', () => {
    expect(defangText('example.com and test.local')).toBe('example[.]com and test[.]local');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/defangUrl.test.ts`

Expected: FAIL because `src/lib/defangUrl.ts` does not exist.

- [ ] **Step 3: Implement defanger**

Write `src/lib/defangUrl.ts`:

```ts
const URL_PROTOCOL_RE = /\b([a-z][a-z0-9+.-]*):\/\//gi;
const DOMAIN_RE = /\b((?:[a-z0-9-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})\b/gi;

export function defangUrl(value: string): string {
  return value.replace(URL_PROTOCOL_RE, '$1[:]//').replace(DOMAIN_RE, (match) => {
    return match.replaceAll('.', '[.]');
  });
}

export function defangText(value: string): string {
  return defangUrl(value);
}
```

- [ ] **Step 4: Run defanger tests**

Run: `npm test -- src/lib/defangUrl.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit defanger**

```bash
git add src/lib/defangUrl.ts src/lib/defangUrl.test.ts
git commit -m "Add QR payload defanging"
```

## Task 3: Implement Payload Parsing

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/parsePayload.test.ts`
- Create: `src/lib/parsePayload.ts`

- [ ] **Step 1: Write shared types**

Write `src/types.ts`:

```ts
export type PayloadType = 'url' | 'deep-link' | 'wifi' | 'email' | 'telephone' | 'sms' | 'text';

export type ParsedPayload =
  | {
      type: 'url' | 'deep-link';
      original: string;
      href: string;
      scheme: string;
      host?: string;
      path?: string;
      search?: string;
    }
  | {
      type: 'wifi';
      original: string;
      ssid?: string;
      encryption?: string;
      password?: string;
      hidden?: boolean;
    }
  | {
      type: 'email';
      original: string;
      href: string;
      address: string;
      subject?: string;
      body?: string;
    }
  | {
      type: 'telephone';
      original: string;
      href: string;
      number: string;
    }
  | {
      type: 'sms';
      original: string;
      href: string;
      number: string;
      body?: string;
    }
  | {
      type: 'text';
      original: string;
      text: string;
    };
```

- [ ] **Step 2: Write failing parser tests**

Write `src/lib/parsePayload.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parsePayload } from './parsePayload';

describe('parsePayload', () => {
  it('parses https URLs', () => {
    expect(parsePayload('https://example.com/path?q=1')).toMatchObject({
      type: 'url',
      original: 'https://example.com/path?q=1',
      href: 'https://example.com/path?q=1',
      scheme: 'https',
      host: 'example.com',
      path: '/path',
      search: '?q=1'
    });
  });

  it('parses custom app links as deep links', () => {
    expect(parsePayload('otpauth://totp/Example:user?secret=abc')).toMatchObject({
      type: 'deep-link',
      scheme: 'otpauth'
    });
  });

  it('parses Wi-Fi QR payloads', () => {
    expect(parsePayload('WIFI:T:WPA;S:Office;P:correct horse;H:true;;')).toEqual({
      type: 'wifi',
      original: 'WIFI:T:WPA;S:Office;P:correct horse;H:true;;',
      encryption: 'WPA',
      ssid: 'Office',
      password: 'correct horse',
      hidden: true
    });
  });

  it('parses mailto payloads', () => {
    expect(parsePayload('mailto:test@example.com?subject=Hello&body=World')).toMatchObject({
      type: 'email',
      href: 'mailto:test@example.com?subject=Hello&body=World',
      address: 'test@example.com',
      subject: 'Hello',
      body: 'World'
    });
  });

  it('parses telephone payloads', () => {
    expect(parsePayload('tel:+15551234567')).toEqual({
      type: 'telephone',
      original: 'tel:+15551234567',
      href: 'tel:+15551234567',
      number: '+15551234567'
    });
  });

  it('parses SMS payloads', () => {
    expect(parsePayload('sms:+15551234567?body=Hi')).toEqual({
      type: 'sms',
      original: 'sms:+15551234567?body=Hi',
      href: 'sms:+15551234567?body=Hi',
      number: '+15551234567',
      body: 'Hi'
    });
  });

  it('keeps plain text as text', () => {
    expect(parsePayload('hello world')).toEqual({
      type: 'text',
      original: 'hello world',
      text: 'hello world'
    });
  });
});
```

- [ ] **Step 3: Run parser tests to verify failure**

Run: `npm test -- src/lib/parsePayload.test.ts`

Expected: FAIL because `parsePayload.ts` does not exist.

- [ ] **Step 4: Implement parser**

Write `src/lib/parsePayload.ts`:

```ts
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
  for (const segment of body.split(';')) {
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
```

- [ ] **Step 5: Run parser tests**

Run: `npm test -- src/lib/parsePayload.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit parser**

```bash
git add src/types.ts src/lib/parsePayload.ts src/lib/parsePayload.test.ts
git commit -m "Parse QR payload types"
```

## Task 4: Implement Shortener Detection

**Files:**
- Create: `src/lib/shorteners.test.ts`
- Create: `src/lib/shorteners.ts`

- [ ] **Step 1: Write failing shortener tests**

Write `src/lib/shorteners.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getShortenerInfo } from './shorteners';

describe('getShortenerInfo', () => {
  it('detects TinyURL preview URLs', () => {
    expect(getShortenerInfo('https://tinyurl.com/abc123')).toEqual({
      host: 'tinyurl.com',
      provider: 'TinyURL',
      previewUrl: 'https://tinyurl.com/preview/abc123',
      strategy: 'preview'
    });
  });

  it('detects is.gd preview URLs', () => {
    expect(getShortenerInfo('https://is.gd/example')).toEqual({
      host: 'is.gd',
      provider: 'is.gd',
      previewUrl: 'https://is.gd/example-',
      strategy: 'preview'
    });
  });

  it('detects v.gd as preview-first', () => {
    expect(getShortenerInfo('https://v.gd/example')).toMatchObject({
      provider: 'v.gd',
      strategy: 'preview'
    });
  });

  it('detects bitly as redirect probing', () => {
    expect(getShortenerInfo('https://bit.ly/abc')).toMatchObject({
      provider: 'Bitly',
      strategy: 'probe'
    });
  });

  it('returns null for normal URLs', () => {
    expect(getShortenerInfo('https://example.com/path')).toBeNull();
  });
});
```

- [ ] **Step 2: Run shortener tests to verify failure**

Run: `npm test -- src/lib/shorteners.test.ts`

Expected: FAIL because `shorteners.ts` does not exist.

- [ ] **Step 3: Implement shortener detection**

Write `src/lib/shorteners.ts`:

```ts
export type ShortenerStrategy = 'preview' | 'probe';

export interface ShortenerInfo {
  host: string;
  provider: string;
  previewUrl?: string;
  strategy: ShortenerStrategy;
}

const PROBE_HOSTS = new Map<string, string>([
  ['bit.ly', 'Bitly'],
  ['bitly.com', 'Bitly'],
  ['t.co', 't.co'],
  ['goo.gl', 'goo.gl'],
  ['ow.ly', 'ow.ly'],
  ['buff.ly', 'buff.ly'],
  ['cutt.ly', 'cutt.ly'],
  ['rebrand.ly', 'Rebrandly'],
  ['lnkd.in', 'LinkedIn'],
  ['s.id', 's.id']
]);

export function getShortenerInfo(value: string): ShortenerInfo | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'tinyurl.com') {
    const alias = parsed.pathname.replace(/^\/+/, '');
    return {
      host,
      provider: 'TinyURL',
      previewUrl: new URL(`/preview/${alias}`, parsed.origin).toString(),
      strategy: 'preview'
    };
  }

  if (host === 'is.gd') {
    return {
      host,
      provider: 'is.gd',
      previewUrl: `${parsed.origin}${parsed.pathname}-`,
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

  const provider = PROBE_HOSTS.get(host);
  return provider ? { host, provider, strategy: 'probe' } : null;
}
```

- [ ] **Step 4: Run shortener tests**

Run: `npm test -- src/lib/shorteners.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit shortener detection**

```bash
git add src/lib/shorteners.ts src/lib/shorteners.test.ts
git commit -m "Detect known short links"
```

## Task 5: Implement Short-Link Expansion State

**Files:**
- Create: `src/lib/shortenerResolver.test.ts`
- Create: `src/lib/shortenerResolver.ts`

- [ ] **Step 1: Write failing resolver tests**

Write `src/lib/shortenerResolver.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { expandShortLink } from './shortenerResolver';

describe('expandShortLink', () => {
  it('returns a preview result for preview-first providers without claiming final target', async () => {
    const fetcher = vi.fn();
    await expect(
      expandShortLink('https://tinyurl.com/abc', {
        provider: 'TinyURL',
        previewUrl: 'https://tinyurl.com/preview/abc',
        fetcher
      })
    ).resolves.toEqual({
      status: 'preview',
      previewUrl: 'https://tinyurl.com/preview/abc',
      chain: ['https://tinyurl.com/abc'],
      message: 'Open the provider preview to inspect the destination before visiting it.'
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('records an observable redirected response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      redirected: true,
      url: 'https://example.com/final'
    });

    await expect(
      expandShortLink('https://bit.ly/abc', { provider: 'Bitly', fetcher })
    ).resolves.toEqual({
      status: 'expanded',
      chain: ['https://bit.ly/abc', 'https://example.com/final'],
      message: 'Browser reported a redirected final URL.'
    });
  });

  it('reports blocked inspection when fetch fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      expandShortLink('https://bit.ly/abc', { provider: 'Bitly', fetcher })
    ).resolves.toMatchObject({
      status: 'blocked',
      chain: ['https://bit.ly/abc']
    });
  });

  it('reports timeout distinctly', async () => {
    const fetcher = vi.fn((_url: string, init?: RequestInit) => {
      init?.signal?.dispatchEvent(new Event('abort'));
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });

    await expect(
      expandShortLink('https://bit.ly/abc', { provider: 'Bitly', fetcher, timeoutMs: 1 })
    ).resolves.toMatchObject({
      status: 'timeout',
      chain: ['https://bit.ly/abc']
    });
  });
});
```

- [ ] **Step 2: Run resolver tests to verify failure**

Run: `npm test -- src/lib/shortenerResolver.test.ts`

Expected: FAIL because `shortenerResolver.ts` does not exist.

- [ ] **Step 3: Implement resolver**

Write `src/lib/shortenerResolver.ts`:

```ts
export type ExpansionStatus = 'idle' | 'preview' | 'expanded' | 'blocked' | 'timeout';

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

export async function expandShortLink(originalUrl: string, options: ExpandOptions): Promise<ExpansionResult> {
  if (options.previewUrl) {
    return {
      status: 'preview',
      previewUrl: options.previewUrl,
      chain: [originalUrl],
      message: 'Open the provider preview to inspect the destination before visiting it.'
    };
  }

  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 7000);

  try {
    const response = await fetcher(originalUrl, {
      method: 'HEAD',
      redirect: 'follow',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal
    });
    const finalUrl = response.url;
    if (response.redirected && finalUrl && finalUrl !== originalUrl) {
      return {
        status: 'expanded',
        chain: [originalUrl, finalUrl],
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
    window.clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run resolver tests**

Run: `npm test -- src/lib/shortenerResolver.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit resolver**

```bash
git add src/lib/shortenerResolver.ts src/lib/shortenerResolver.test.ts
git commit -m "Add explicit short-link expansion state"
```

## Task 6: Implement Original-Value Actions

**Files:**
- Create: `src/lib/actions.test.ts`
- Create: `src/lib/actions.ts`

- [ ] **Step 1: Write failing action tests**

Write `src/lib/actions.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { buildOpenTarget, copyOriginalPayload } from './actions';
import type { ParsedPayload } from '../types';

describe('copyOriginalPayload', () => {
  it('copies original QR payload, not display text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await copyOriginalPayload(
      {
        type: 'url',
        original: 'https://example.com',
        href: 'https://example.com',
        scheme: 'https'
      },
      { writeText }
    );
    expect(writeText).toHaveBeenCalledWith('https://example.com');
  });
});

describe('buildOpenTarget', () => {
  it('opens original URL payload', () => {
    const payload: ParsedPayload = {
      type: 'url',
      original: 'https://example.com',
      href: 'https://example.com',
      scheme: 'https',
      host: 'example.com'
    };
    expect(buildOpenTarget(payload)).toBe('https://example.com');
  });

  it('opens original app deep link', () => {
    const payload: ParsedPayload = {
      type: 'deep-link',
      original: 'otpauth://totp/Example',
      href: 'otpauth://totp/Example',
      scheme: 'otpauth'
    };
    expect(buildOpenTarget(payload)).toBe('otpauth://totp/Example');
  });

  it('does not offer open for Wi-Fi payloads', () => {
    expect(
      buildOpenTarget({
        type: 'wifi',
        original: 'WIFI:S:Office;;',
        ssid: 'Office'
      })
    ).toBeNull();
  });

  it('does not offer open for plain text', () => {
    expect(buildOpenTarget({ type: 'text', original: 'hello', text: 'hello' })).toBeNull();
  });
});
```

- [ ] **Step 2: Run action tests to verify failure**

Run: `npm test -- src/lib/actions.test.ts`

Expected: FAIL because `actions.ts` does not exist.

- [ ] **Step 3: Implement actions**

Write `src/lib/actions.ts`:

```ts
import type { ParsedPayload } from '../types';

export interface ClipboardLike {
  writeText(value: string): Promise<void>;
}

export async function copyOriginalPayload(payload: ParsedPayload, clipboard: ClipboardLike = navigator.clipboard): Promise<void> {
  await clipboard.writeText(payload.original);
}

export function buildOpenTarget(payload: ParsedPayload): string | null {
  switch (payload.type) {
    case 'url':
    case 'deep-link':
    case 'email':
    case 'telephone':
    case 'sms':
      return payload.href;
    case 'wifi':
    case 'text':
      return null;
  }
}
```

- [ ] **Step 4: Run action tests**

Run: `npm test -- src/lib/actions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit actions**

```bash
git add src/lib/actions.ts src/lib/actions.test.ts
git commit -m "Keep QR actions on original values"
```

## Task 7: Build Result UI

**Files:**
- Create: `src/components/ActionBar.tsx`
- Create: `src/components/ParsedDetails.tsx`
- Create: `src/components/ShortLinkPanel.tsx`
- Create: `src/components/ResultScreen.tsx`
- Create: `src/test/actionHarness.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing UI action harness test**

Write `src/test/actionHarness.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ResultScreen from '../components/ResultScreen';

describe('ResultScreen actions', () => {
  it('copies original value while displaying defanged value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ResultScreen rawPayload="https://example.com/path" onScanAgain={() => {}} />);

    expect(screen.getByText('https[:]//example[.]com/path')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('https://example.com/path');
  });
});
```

- [ ] **Step 2: Run UI test to verify failure**

Run: `npm test -- src/test/actionHarness.test.tsx`

Expected: FAIL because `ResultScreen` does not exist.

- [ ] **Step 3: Implement component files**

Write `src/components/ActionBar.tsx`:

```tsx
interface ActionBarProps {
  canOpen: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onScanAgain: () => void;
}

export default function ActionBar({ canOpen, onCopy, onOpen, onScanAgain }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button type="button" className="secondary-button" onClick={onScanAgain}>
        Scan Again
      </button>
      <button type="button" className="secondary-button" onClick={onCopy}>
        Copy
      </button>
      {canOpen ? (
        <button type="button" className="primary-button" onClick={onOpen}>
          Open
        </button>
      ) : null}
    </div>
  );
}
```

Write `src/components/ParsedDetails.tsx`:

```tsx
import type { ParsedPayload } from '../types';

export default function ParsedDetails({ payload }: { payload: ParsedPayload }) {
  const rows = getRows(payload);
  if (rows.length === 0) {
    return null;
  }

  return (
    <dl className="details-list">
      {rows.map(([label, value]) => (
        <div key={label} className="details-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getRows(payload: ParsedPayload): Array<[string, string]> {
  switch (payload.type) {
    case 'url':
    case 'deep-link':
      return [
        ['Scheme', payload.scheme],
        ['Host', payload.host ?? 'Not present'],
        ['Path', payload.path ?? '/'],
        ['Query', payload.search ?? 'None']
      ];
    case 'wifi':
      return [
        ['Network', payload.ssid ?? 'Not present'],
        ['Encryption', payload.encryption ?? 'Not specified'],
        ['Password', payload.password ? 'Present in QR payload' : 'Not present'],
        ['Hidden', payload.hidden ? 'Yes' : 'No']
      ];
    case 'email':
      return [
        ['Address', payload.address],
        ['Subject', payload.subject ?? 'None'],
        ['Body', payload.body ? 'Present in QR payload' : 'None']
      ];
    case 'telephone':
      return [['Number', payload.number]];
    case 'sms':
      return [
        ['Number', payload.number],
        ['Body', payload.body ?? 'None']
      ];
    case 'text':
      return [];
  }
}
```

Write `src/components/ShortLinkPanel.tsx`:

```tsx
import { useState } from 'react';
import { defangUrl } from '../lib/defangUrl';
import { expandShortLink, type ExpansionResult } from '../lib/shortenerResolver';
import type { ShortenerInfo } from '../lib/shorteners';

interface ShortLinkPanelProps {
  originalUrl: string;
  info: ShortenerInfo;
}

export default function ShortLinkPanel({ originalUrl, info }: ShortLinkPanelProps) {
  const [result, setResult] = useState<ExpansionResult | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  async function handleExpand() {
    setIsExpanding(true);
    setResult(await expandShortLink(originalUrl, { provider: info.provider, previewUrl: info.previewUrl }));
    setIsExpanding(false);
  }

  return (
    <section className="short-link-panel" aria-label="Short link inspection">
      <h2>Short Link</h2>
      <p>{info.provider} links can hide the destination. Expansion only runs when you choose it.</p>
      <button type="button" className="secondary-button" onClick={handleExpand} disabled={isExpanding}>
        {isExpanding ? 'Inspecting...' : 'Expand short link'}
      </button>
      {result ? (
        <div className="expansion-result">
          <p>{result.message}</p>
          <ol>
            {result.chain.map((url) => (
              <li key={url}>{defangUrl(url)}</li>
            ))}
          </ol>
          {result.previewUrl ? (
            <a href={result.previewUrl} target="_blank" rel="noreferrer">
              Open provider preview
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
```

Write `src/components/ResultScreen.tsx`:

```tsx
import ActionBar from './ActionBar';
import ParsedDetails from './ParsedDetails';
import ShortLinkPanel from './ShortLinkPanel';
import { buildOpenTarget, copyOriginalPayload } from '../lib/actions';
import { defangText } from '../lib/defangUrl';
import { parsePayload } from '../lib/parsePayload';
import { getShortenerInfo } from '../lib/shorteners';

interface ResultScreenProps {
  rawPayload: string;
  onScanAgain: () => void;
}

export default function ResultScreen({ rawPayload, onScanAgain }: ResultScreenProps) {
  const payload = parsePayload(rawPayload);
  const openTarget = buildOpenTarget(payload);
  const shortener = payload.type === 'url' ? getShortenerInfo(payload.href) : null;

  function handleOpen() {
    if (openTarget) {
      window.open(openTarget, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <main className="screen result-screen">
      <section className="result-summary">
        <p className="eyebrow">Payload Type</p>
        <h1>{payload.type}</h1>
        <pre className="payload-display">{defangText(payload.original)}</pre>
      </section>

      <ParsedDetails payload={payload} />

      {shortener ? <ShortLinkPanel originalUrl={payload.href} info={shortener} /> : null}

      <ActionBar
        canOpen={Boolean(openTarget)}
        onCopy={() => void copyOriginalPayload(payload)}
        onOpen={handleOpen}
        onScanAgain={onScanAgain}
      />
    </main>
  );
}
```

- [ ] **Step 4: Add result styles**

Append to `src/styles.css`:

```css
.screen {
  width: min(100%, 720px);
  margin: 0 auto;
  padding: 24px 18px 96px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #5b6a64;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.result-summary h1 {
  margin: 0 0 16px;
  color: #10231f;
  font-size: 2rem;
  text-transform: capitalize;
}

.payload-display {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  margin: 0;
  padding: 16px;
  border: 1px solid #cdd8d1;
  border-radius: 8px;
  background: #ffffff;
  color: #10231f;
  font-size: 1rem;
  line-height: 1.45;
}

.details-list,
.short-link-panel {
  margin: 18px 0 0;
  padding: 16px;
  border: 1px solid #dce4df;
  border-radius: 8px;
  background: #ffffff;
}

.details-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #edf1ee;
}

.details-row:last-child {
  border-bottom: 0;
}

.details-row dt {
  color: #5b6a64;
  font-weight: 700;
}

.details-row dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 12px max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  border-top: 1px solid #dce4df;
  background: rgb(245 247 244 / 0.96);
}

.primary-button,
.secondary-button {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  border: 1px solid #10231f;
  font-weight: 800;
}

.primary-button {
  background: #10231f;
  color: #ffffff;
}

.secondary-button {
  background: #ffffff;
  color: #10231f;
}
```

- [ ] **Step 5: Run UI action test**

Run: `npm test -- src/test/actionHarness.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit result UI**

```bash
git add src/components/ActionBar.tsx src/components/ParsedDetails.tsx src/components/ShortLinkPanel.tsx src/components/ResultScreen.tsx src/test/actionHarness.test.tsx src/styles.css
git commit -m "Build QR inspection result view"
```

## Task 8: Build Home, Privacy, and App Flow

**Files:**
- Create: `src/components/LogoHeader.tsx`
- Create: `src/components/HomeScreen.tsx`
- Create: `src/components/PrivacyScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement app flow components**

Write `src/components/LogoHeader.tsx`:

```tsx
export default function LogoHeader() {
  return (
    <header className="logo-header">
      <img src="/qrholmes.png" alt="" />
      <span>QRHolmes</span>
    </header>
  );
}
```

Write `src/components/HomeScreen.tsx`:

```tsx
import LogoHeader from './LogoHeader';

interface HomeScreenProps {
  onInspect: () => void;
  onPrivacy: () => void;
}

export default function HomeScreen({ onInspect, onPrivacy }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <LogoHeader />
      <section className="home-primary">
        <button type="button" className="inspect-button" onClick={onInspect}>
          Inspect QR
        </button>
      </section>
      <button type="button" className="link-button" onClick={onPrivacy}>
        Privacy
      </button>
    </main>
  );
}
```

Write `src/components/PrivacyScreen.tsx`:

```tsx
interface PrivacyScreenProps {
  onBack: () => void;
}

export default function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <main className="screen privacy-screen">
      <button type="button" className="link-button" onClick={onBack}>
        Back
      </button>
      <h1>Privacy</h1>
      <p>QR inspection runs in this browser. QR contents are not sent to the hosting provider.</p>
      <p>Expanding a short link contacts the shortener only after you choose that action.</p>
      <p>Opening a link contacts the destination. Copying does not make a network request.</p>
    </main>
  );
}
```

- [ ] **Step 2: Wire app screen state**

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import PrivacyScreen from './components/PrivacyScreen';
import ResultScreen from './components/ResultScreen';
import ScannerScreen from './components/ScannerScreen';

type Screen =
  | { name: 'home' }
  | { name: 'scanner' }
  | { name: 'result'; rawPayload: string }
  | { name: 'privacy' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  if (screen.name === 'scanner') {
    return (
      <ScannerScreen
        onCancel={() => setScreen({ name: 'home' })}
        onDetected={(rawPayload) => setScreen({ name: 'result', rawPayload })}
      />
    );
  }

  if (screen.name === 'result') {
    return <ResultScreen rawPayload={screen.rawPayload} onScanAgain={() => setScreen({ name: 'scanner' })} />;
  }

  if (screen.name === 'privacy') {
    return <PrivacyScreen onBack={() => setScreen({ name: 'home' })} />;
  }

  return <HomeScreen onInspect={() => setScreen({ name: 'scanner' })} onPrivacy={() => setScreen({ name: 'privacy' })} />;
}
```

- [ ] **Step 3: Add home and privacy styles**

Append to `src/styles.css`:

```css
.home-screen {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
}

.logo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #10231f;
  font-size: 1.2rem;
  font-weight: 900;
}

.logo-header img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.home-primary {
  display: grid;
  place-items: center;
}

.inspect-button {
  width: min(68vw, 280px);
  aspect-ratio: 1;
  border: 0;
  border-radius: 50%;
  background: #10231f;
  color: #ffffff;
  box-shadow: 0 18px 48px rgb(16 35 31 / 0.24);
  font-size: clamp(1.3rem, 7vw, 2.25rem);
  font-weight: 900;
}

.link-button {
  width: fit-content;
  border: 0;
  padding: 8px 0;
  background: transparent;
  color: #315f52;
  font-weight: 800;
  text-decoration: underline;
}

.privacy-screen h1 {
  margin: 32px 0 16px;
}

.privacy-screen p {
  color: #34443f;
  font-size: 1.05rem;
  line-height: 1.55;
}
```

- [ ] **Step 4: Run TypeScript lint to expose missing scanner**

Run: `npm run lint`

Expected: FAIL because `src/components/ScannerScreen.tsx` has not been created yet.

- [ ] **Step 5: Commit app flow after scanner task, not now**

Do not commit this task until Task 9 creates `ScannerScreen.tsx` and `npm run lint` passes.

## Task 9: Build Camera Scanner

**Files:**
- Create: `src/components/ScannerScreen.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement scanner component**

Write `src/components/ScannerScreen.tsx`:

```tsx
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';

interface ScannerScreenProps {
  onCancel: () => void;
  onDetected: (rawPayload: string) => void;
}

type ScannerStatus = 'starting' | 'scanning' | 'denied' | 'unavailable' | 'decode-error';

export default function ScannerScreen({ onCancel, onDetected }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('starting');

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('scanning');
          scanFrame();
        }
      } catch (error) {
        const name = error instanceof DOMException ? error.name : '';
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      }
    }

    function scanFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameRef.current = window.requestAnimationFrame(scanFrame);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        setStatus('decode-error');
        return;
      }
      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);
      if (code?.data) {
        onDetected(code.data);
        return;
      }
      frameRef.current = window.requestAnimationFrame(scanFrame);
    }

    void startCamera();

    return () => {
      active = false;
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected]);

  return (
    <main className="scanner-screen">
      <div className="scanner-topbar">
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
        <span>{scannerMessage(status)}</span>
      </div>
      <div className="scanner-frame">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <p className="scanner-help">{scannerHelp(status)}</p>
    </main>
  );
}

function scannerMessage(status: ScannerStatus): string {
  switch (status) {
    case 'starting':
      return 'Starting camera';
    case 'scanning':
      return 'Looking for QR code';
    case 'denied':
      return 'Camera permission denied';
    case 'unavailable':
      return 'Camera unavailable';
    case 'decode-error':
      return 'Could not read camera frame';
  }
}

function scannerHelp(status: ScannerStatus): string {
  switch (status) {
    case 'starting':
      return 'Your browser will ask for camera access when needed.';
    case 'scanning':
      return 'Hold the QR code inside the frame.';
    case 'denied':
      return 'Allow camera access in browser settings, then try again.';
    case 'unavailable':
      return 'This browser or device does not expose a camera API here.';
    case 'decode-error':
      return 'The browser provided a camera frame that could not be inspected.';
  }
}
```

- [ ] **Step 2: Add scanner styles**

Append to `src/styles.css`:

```css
.scanner-screen {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 18px;
  padding: 18px;
  background: #10231f;
  color: #ffffff;
}

.scanner-screen .link-button {
  color: #d8fff3;
}

.scanner-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-weight: 800;
}

.scanner-frame {
  position: relative;
  overflow: hidden;
  align-self: center;
  width: min(100%, 560px);
  aspect-ratio: 1;
  margin: 0 auto;
  border: 2px solid #d8fff3;
  border-radius: 24px;
  background: #071512;
}

.scanner-frame video,
.scanner-frame canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-frame canvas {
  display: none;
}

.scanner-help {
  max-width: 560px;
  margin: 0 auto;
  color: #d8fff3;
  text-align: center;
}
```

- [ ] **Step 3: Run lint and tests**

Run: `npm run lint`

Expected: PASS.

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Commit app flow and scanner**

```bash
git add src/App.tsx src/components/LogoHeader.tsx src/components/HomeScreen.tsx src/components/PrivacyScreen.tsx src/components/ScannerScreen.tsx src/styles.css
git commit -m "Add QRHolmes app flow and scanner"
```

## Task 10: Add PWA Assets and Icons

**Files:**
- Create: `scripts/generate-icons.mjs`
- Create: `public/manifest.webmanifest`
- Create: `public/robots.txt`
- Create generated: `public/icons/icon-192.png`
- Create generated: `public/icons/icon-512.png`
- Create generated: `public/icons/maskable-192.png`
- Create generated: `public/icons/maskable-512.png`

- [ ] **Step 1: Add icon generation script**

Write `scripts/generate-icons.mjs`:

```js
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'qrholmes.png';
const outputDir = 'public/icons';

await mkdir(outputDir, { recursive: true });

async function squareIcon(size, name, padding = 0) {
  const inner = size - padding * 2;
  const image = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 16, g: 35, b: 31, alpha: 1 }
    }
  })
    .composite([{ input: image, gravity: 'center' }])
    .png()
    .toFile(`${outputDir}/${name}`);
}

await squareIcon(192, 'icon-192.png');
await squareIcon(512, 'icon-512.png');
await squareIcon(192, 'maskable-192.png', 32);
await squareIcon(512, 'maskable-512.png', 86);
```

- [ ] **Step 2: Add manifest and robots**

Write `public/manifest.webmanifest`:

```json
{
  "name": "QRHolmes",
  "short_name": "QRHolmes",
  "description": "Inspect QR code contents locally in your browser.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f5f7f4",
  "theme_color": "#10231f",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Write `public/robots.txt`:

```text
User-agent: *
Allow: /
```

- [ ] **Step 3: Copy root logo into public for runtime use**

Run: `cp qrholmes.png public/qrholmes.png`

Expected: `public/qrholmes.png` exists and matches the root source.

- [ ] **Step 4: Generate icons**

Run: `npm run icons`

Expected: four PNG files exist under `public/icons/`.

- [ ] **Step 5: Build with PWA assets**

Run: `npm run build`

Expected: PASS and `dist/manifest.webmanifest` plus service worker assets exist.

- [ ] **Step 6: Commit PWA assets**

```bash
git add scripts/generate-icons.mjs public/manifest.webmanifest public/robots.txt public/qrholmes.png public/icons/icon-192.png public/icons/icon-512.png public/icons/maskable-192.png public/icons/maskable-512.png
git commit -m "Add QRHolmes PWA assets"
```

## Task 11: Final Verification

**Files:**
- Modify only if verification exposes bugs: `src/**`, `public/**`, config files

- [ ] **Step 1: Run full automated verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Start local dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser-check core screens**

Open the local URL in the in-app browser.

Check desktop viewport:

- Home screen shows logo at top and large round `Inspect QR` button.
- Privacy screen states that QR contents are not sent to hosting provider.
- Scanner screen requests camera only after `Inspect QR`.
- If camera permission is denied or unavailable, error text is plain and actionable.

Check mobile viewport widths 390px and 430px:

- No text overlaps.
- Bottom action bar fits without horizontal scrolling.
- Payload display wraps long URLs.

- [ ] **Step 4: Browser-check mocked result path if camera is unavailable**

Temporarily add this development-only button inside `HomeScreen` under the inspect button:

```tsx
<button type="button" className="secondary-button" onClick={() => onDetectedSample('https://tinyurl.com/example')}>
  Sample Result
</button>
```

Do not commit this temporary button. Use it only if no camera test path is available, then remove it before final build.

Expected result screen behavior:

- Defanged display shows `https[:]//tinyurl[.]com/example`.
- Copy writes `https://tinyurl.com/example`.
- Short-link expansion shows disclosure before any network request and only runs after button click.
- Open action uses the original URL.

- [ ] **Step 5: Verify offline app shell after first visit**

Build and preview:

```bash
npm run build
npx vite preview --host 127.0.0.1
```

Open the preview URL once, then use browser devtools or the in-app browser network controls to simulate offline.

Expected: refreshing the app shell still loads after first visit.

- [ ] **Step 6: Remove temporary verification changes**

Run: `git status --short`

Expected: no uncommitted temporary changes except intentional fixes. If the sample result button was added, remove it and rerun:

```bash
npm run build
npm test
```

- [ ] **Step 7: Commit verification fixes if any**

Only if files changed during verification:

```bash
git add src public vite.config.ts package.json package-lock.json
git commit -m "Polish QRHolmes verification issues"
```

## Self-Review

- Spec coverage: Tasks cover static Vite PWA setup, client-side camera scanning, payload parsing, defanging, explicit original-value copy/open actions, short-link detection and explicit expansion, privacy disclosure, PWA assets, offline shell verification, and mobile/browser verification.
- Placeholder scan: No open-ended placeholder markers or unspecified implementation steps remain.
- Type consistency: `ParsedPayload`, `ShortenerInfo`, `ExpansionResult`, and action helper signatures are defined before use and referenced consistently across tasks.
