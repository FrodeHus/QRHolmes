import { describe, expect, it, vi } from 'vitest';
import type { ParsedPayload } from '../types';
import { buildOpenTarget, copyOriginalPayload } from './actions';

type ActionablePayload = Extract<ParsedPayload, { href: string }>;

describe('copyOriginalPayload', () => {
  it('copies the original payload instead of display or defanged text', async () => {
    const payload: ParsedPayload = {
      type: 'url',
      original: 'https://example.com/login?next=http://evil.example',
      href: 'https://example.com/login?next=http://evil.example',
      scheme: 'https',
      host: 'example.com'
    };
    const clipboard = {
      writeText: vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined)
    };

    await copyOriginalPayload(payload, clipboard);

    expect(clipboard.writeText).toHaveBeenCalledWith(payload.original);
    expect(clipboard.writeText).not.toHaveBeenCalledWith('hxxps://example[.]com/login?next=hxxp://evil[.]example');
  });
});

describe('buildOpenTarget', () => {
  it('returns the original actionable href for URL payloads', () => {
    const payload: ParsedPayload = {
      type: 'url',
      original: '  https://example.com/path  ',
      href: 'https://example.com/path',
      scheme: 'https',
      host: 'example.com',
      path: '/path'
    };

    expect(buildOpenTarget(payload)).toBe('https://example.com/path');
    expect(buildOpenTarget(payload)).not.toBe(payload.original);
  });

  it.each<ActionablePayload>([
    {
      type: 'deep-link',
      original: 'otpauth://totp/Example:user?secret=abc',
      href: 'otpauth://totp/Example:user?secret=abc',
      scheme: 'otpauth'
    },
    {
      type: 'email',
      original: 'mailto:test@example.com?subject=Hello',
      href: 'mailto:test@example.com?subject=Hello',
      address: 'test@example.com',
      subject: 'Hello'
    },
    {
      type: 'telephone',
      original: 'tel:+15551234567',
      href: 'tel:+15551234567',
      number: '+15551234567'
    },
    {
      type: 'sms',
      original: 'sms:+15551234567?body=Hi',
      href: 'sms:+15551234567?body=Hi',
      number: '+15551234567',
      body: 'Hi'
    }
  ])('returns the actionable href for $type payloads', (payload) => {
    expect(buildOpenTarget(payload)).toBe(payload.href);
  });

  it.each<ParsedPayload>([
    {
      type: 'wifi',
      original: 'WIFI:T:WPA;S:Office;P:correct horse;;',
      encryption: 'WPA',
      ssid: 'Office',
      password: 'correct horse'
    },
    {
      type: 'text',
      original: 'hello world',
      text: 'hello world'
    }
  ])('returns null for $type payloads', (payload) => {
    expect(buildOpenTarget(payload)).toBeNull();
  });
});
