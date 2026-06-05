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
