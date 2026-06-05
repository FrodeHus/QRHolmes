import type { ParsedPayload } from '../types';

export default function ParsedDetails({ payload }: { payload: ParsedPayload }) {
  const rows = getRows(payload);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="details-panel" aria-label="Parsed details">
      <h2>Parsed Details</h2>
      <dl className="details-list">
        {rows.map(([label, value]) => (
          <div key={label} className="details-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
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
