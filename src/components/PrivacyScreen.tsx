interface PrivacyScreenProps {
  onBack: () => void;
}

export default function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <main className="screen privacy-screen">
      <section className="plain-panel">
        <div className="privacy-title-row">
          <span className="privacy-lock" aria-hidden="true" />
          <div>
            <h1>Privacy</h1>
            <p className="eyebrow">What QR Holmes does and does not do</p>
          </div>
        </div>
        <div className="privacy-list">
          <article>
            <h2>Everything runs on your device</h2>
            <p>
              Decoding and payload inspection happen locally in your browser.
            </p>
          </article>
          <article>
            <h2>No accounts, no tracking</h2>
            <p>
              No sign-in, analytics, ad SDKs, or profiling are required for QR
              inspection.
            </p>
          </article>
          <article>
            <h2>Camera is opt-in</h2>
            <p>
              The camera only activates while you are on the scanner and stops
              when you leave it.
            </p>
          </article>
        </div>
        <div className="privacy-note">
          Opening a link contacts the destination. Copying does not make a
          network request.
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={onBack}
        >
          Got it
        </button>
      </section>
    </main>
  );
}
