import { useState } from 'react';
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
  const [copyLabel, setCopyLabel] = useState('Copy');
  const payload = parsePayload(rawPayload);
  const openTarget = buildOpenTarget(payload);
  const shortener = payload.type === 'url' ? getShortenerInfo(openTarget ?? '') : null;

  async function handleCopy() {
    try {
      await copyOriginalPayload(payload);
      setCopyLabel('Copied');
      window.setTimeout(() => setCopyLabel('Copy'), 1600);
    } catch {
      setCopyLabel('Copy Failed');
      window.setTimeout(() => setCopyLabel('Copy'), 2200);
    }
  }

  function handleOpen() {
    if (openTarget) {
      window.open(openTarget, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <main className="screen result-screen">
      <section className="result-summary">
        <p className="eyebrow">Payload Type</p>
        <h1>{formatType(payload.type)}</h1>
        <pre className="payload-display">{defangText(payload.original)}</pre>
      </section>

      <ParsedDetails payload={payload} />

      {shortener && openTarget ? <ShortLinkPanel originalUrl={openTarget} info={shortener} /> : null}

      <ActionBar
        canOpen={Boolean(openTarget)}
        copyLabel={copyLabel}
        onCopy={() => void handleCopy()}
        onOpen={handleOpen}
        onScanAgain={onScanAgain}
      />
    </main>
  );
}

function formatType(type: string): string {
  return type
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}
