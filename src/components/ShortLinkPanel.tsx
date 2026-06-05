import type { ShortenerInfo } from "../lib/shorteners";

interface ShortLinkPanelProps {
  originalUrl: string;
  info: ShortenerInfo;
}

export default function ShortLinkPanel({
  originalUrl,
  info,
}: ShortLinkPanelProps) {
  function handleOpen() {
    if (info.previewUrl) {
      window.open(info.previewUrl, "_blank", "noopener,noreferrer");
    }
  }
  return (
    <section className="short-link-panel" aria-label="Short link inspection">
      <p className="eyebrow">Short Link</p>
      <h2>{info.provider}</h2>
      <p>{info.provider} links can hide the destination.</p>
      {info.strategy === "preview" ? (
        <p>This provider can show a preview page to display the destination.</p>
      ) : (
        <p>
          This provider, unfortunately, does not support previewing the
          destination.
        </p>
      )}
      {info.strategy === "preview" && info.previewUrl ? (
        <button
          type="button"
          className="button button-secondary"
          onClick={handleOpen}
          title={`Preview the destination of this ${info.provider} link`}
        >{`Preview the destination of this ${info.provider} link`}</button>
      ) : null}
    </section>
  );
}
