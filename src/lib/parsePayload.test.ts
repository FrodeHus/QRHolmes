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

  it('preserves raw original while trimming actionable URL fields', () => {
    expect(parsePayload('  https://example.com  ')).toMatchObject({
      type: 'url',
      original: '  https://example.com  ',
      href: 'https://example.com'
    });
  });

  it('parses custom app links as deep links', () => {
    expect(parsePayload('otpauth://totp/Example:user?secret=abc')).toMatchObject({
      type: 'deep-link',
      scheme: 'otpauth'
    });
  });

  it('falls back to deep links for invalid custom-scheme URLs', () => {
    expect(parsePayload('custom:bad value')).toEqual({
      type: 'deep-link',
      original: 'custom:bad value',
      href: 'custom:bad value',
      scheme: 'custom'
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

  it('unescapes reserved Wi-Fi field characters', () => {
    expect(parsePayload('WIFI:T:WPA;S:Office\\;West;P:comma\\,colon\\:quote\\";H:false;;')).toEqual({
      type: 'wifi',
      original: 'WIFI:T:WPA;S:Office\\;West;P:comma\\,colon\\:quote\\";H:false;;',
      encryption: 'WPA',
      ssid: 'Office;West',
      password: 'comma,colon:quote"',
      hidden: false
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

  it('falls back to deep links for malformed mailto payloads', () => {
    expect(parsePayload('mailto:%')).toEqual({
      type: 'deep-link',
      original: 'mailto:%',
      href: 'mailto:%',
      scheme: 'mailto'
    });
  });

  it('does not throw for incomplete encoded mailto payloads', () => {
    expect(parsePayload('mailto:%E0%A4%A')).toEqual({
      type: 'deep-link',
      original: 'mailto:%E0%A4%A',
      href: 'mailto:%E0%A4%A',
      scheme: 'mailto'
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

  it('parses SMSTO payloads with colon-separated body', () => {
    expect(parsePayload('SMSTO:+15551234567:Hi there')).toEqual({
      type: 'sms',
      original: 'SMSTO:+15551234567:Hi there',
      href: 'SMSTO:+15551234567:Hi there',
      number: '+15551234567',
      body: 'Hi there'
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
