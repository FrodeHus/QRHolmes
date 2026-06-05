import type { ParsedPayload } from '../types';

export interface ClipboardLike {
  writeText(value: string): Promise<void>;
}

export async function copyOriginalPayload(
  payload: ParsedPayload,
  clipboard: ClipboardLike = navigator.clipboard
): Promise<void> {
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
