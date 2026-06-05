interface PrivacyScreenProps {
  onBack: () => void;
}

export default function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <main className="screen privacy-screen">
      <button type="button" className="link-button" onClick={onBack}>
        Back
      </button>
      <section className="plain-panel">
        <p className="eyebrow">Local Inspection</p>
        <h1>Privacy</h1>
        <p>QR inspection runs in this browser. QR contents are not sent to the hosting provider.</p>
        <p>
          Expanding a short link sends a request from this device to the shortener and may also contact redirected
          destinations your browser follows.
        </p>
        <p>Opening a link contacts the destination. Copying does not make a network request.</p>
      </section>
    </main>
  );
}
