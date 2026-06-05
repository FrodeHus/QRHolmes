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

  it('detects Bitly as probe-only', () => {
    expect(getShortenerInfo('https://bit.ly/abc')).toEqual({
      provider: 'Bitly',
      host: 'bit.ly',
      strategy: 'probe'
    });
  });

  it('ignores normal URLs', () => {
    expect(getShortenerInfo('https://example.com/path')).toBeNull();
  });
});
