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
