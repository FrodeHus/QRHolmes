const URL_PROTOCOL_RE = /\b([a-z][a-z0-9+.-]*):\/\//gi;
const DOMAIN_RE = /\b((?:[a-z0-9-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})\b/gi;

export function defangUrl(value: string): string {
  return value.replace(URL_PROTOCOL_RE, '$1[:]//').replace(DOMAIN_RE, (match) => {
    return match.replaceAll('.', '[.]');
  });
}

export function defangText(value: string): string {
  return defangUrl(value);
}
