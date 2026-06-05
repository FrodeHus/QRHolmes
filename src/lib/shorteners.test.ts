import { describe, expect, it } from 'vitest';
import { getShortenerInfo } from './shorteners';

describe('getShortenerInfo', () => {
  it('detects TinyURL and builds the preview URL', () => {
    expect(getShortenerInfo('https://tinyurl.com/abc123')).toEqual({
      provider: 'TinyURL',
      host: 'tinyurl.com',
      previewUrl: 'https://tinyurl.com/preview/abc123',
      strategy: 'preview'
    });
  });

  it('normalizes TinyURL hosts before detection', () => {
    expect(getShortenerInfo('https://WWW.TINYURL.COM/abc123')).toEqual({
      provider: 'TinyURL',
      host: 'tinyurl.com',
      previewUrl: 'https://www.tinyurl.com/preview/abc123',
      strategy: 'preview'
    });
  });

  it('detects is.gd and appends the preview suffix', () => {
    expect(getShortenerInfo('https://is.gd/example')).toEqual({
      provider: 'is.gd',
      host: 'is.gd',
      previewUrl: 'https://is.gd/example-',
      strategy: 'preview'
    });
  });

  it('detects v.gd as preview-first', () => {
    expect(getShortenerInfo('https://v.gd/example')).toEqual({
      provider: 'v.gd',
      host: 'v.gd',
      previewUrl: 'https://v.gd/example',
      strategy: 'preview'
    });
  });

  it.each([
    ['https://bit.ly/abc', 'Bitly', 'bit.ly'],
    ['https://bitly.com/abc', 'Bitly', 'bitly.com'],
    ['https://t.co/abc', 't.co', 't.co'],
    ['https://goo.gl/abc', 'goo.gl', 'goo.gl'],
    ['https://ow.ly/abc', 'ow.ly', 'ow.ly'],
    ['https://buff.ly/abc', 'buff.ly', 'buff.ly'],
    ['https://cutt.ly/abc', 'cutt.ly', 'cutt.ly'],
    ['https://rebrand.ly/abc', 'rebrand.ly', 'rebrand.ly'],
    ['https://lnkd.in/abc', 'lnkd.in', 'lnkd.in'],
    ['https://s.id/abc', 's.id', 's.id']
  ])('detects %s as probe-only', (value, provider, host) => {
    expect(getShortenerInfo(value)).toEqual({
      provider,
      host,
      strategy: 'probe'
    });
  });

  it('ignores normal URLs', () => {
    expect(getShortenerInfo('https://example.com/path')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getShortenerInfo('not a url')).toBeNull();
  });
});
