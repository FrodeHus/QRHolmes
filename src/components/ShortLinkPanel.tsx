import { useState } from 'react';
import { defangUrl } from '../lib/defangUrl';
import {
  EXPANSION_NETWORK_NOTICE,
  expandShortLink,
  type ExpansionResult
} from '../lib/shortenerResolver';
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
    try {
      setResult(await expandShortLink(originalUrl, { provider: info.provider, previewUrl: info.previewUrl }));
    } finally {
      setIsExpanding(false);
    }
  }

  return (
    <section className="short-link-panel" aria-label="Short link inspection">
      <p className="eyebrow">Short Link</p>
      <h2>{info.provider}</h2>
      <p>{info.provider} links can hide the destination. Expansion only runs when you choose it.</p>
      <p className="network-notice">{EXPANSION_NETWORK_NOTICE}</p>
      <button type="button" className="button button-secondary" onClick={handleExpand} disabled={isExpanding}>
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
        </div>
      ) : null}
    </section>
  );
}
