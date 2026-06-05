interface ActionBarProps {
  canOpen: boolean;
  copyLabel: string;
  onCopy: () => void;
  onOpen: () => void;
  onScanAgain: () => void;
}

export default function ActionBar({ canOpen, copyLabel, onCopy, onOpen, onScanAgain }: ActionBarProps) {
  return (
    <div className="action-bar" aria-label="QR actions">
      <button type="button" className="button button-secondary" onClick={onScanAgain}>
        Scan Again
      </button>
      <button type="button" className="button button-secondary" onClick={onCopy}>
        {copyLabel}
      </button>
      {canOpen ? (
        <button type="button" className="button button-primary" onClick={onOpen}>
          Open
        </button>
      ) : null}
    </div>
  );
}
