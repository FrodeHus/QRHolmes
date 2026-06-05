import { useEffect, useState } from "react";
import LogoHeader from "./LogoHeader";

interface HomeScreenProps {
  onInspect: () => void;
  onPrivacy: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isRunningStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getManualInstallCopy() {
  const userAgent = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  if (isIos) {
    return {
      summary: "Use Safari Share to add it.",
      details: "Tap Share, then Add to Home Screen.",
    };
  }

  if (isAndroid) {
    return {
      summary: "Use your browser menu to add it.",
      details: "Open the browser menu, then tap Install app or Add to Home screen.",
    };
  }

  return null;
}

export default function HomeScreen({ onInspect, onPrivacy }: HomeScreenProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const manualInstallCopy = getManualInstallCopy();

  useEffect(() => {
    if (!isRunningStandalone() && manualInstallCopy) {
      setShowInstall(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
      setInstallHelp(false);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setShowInstall(false);
      setInstallHelp(false);
      showToast("Added to Home Screen");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  async function handleInstall() {
    if (!installPrompt) {
      setInstallHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);

    if (choice.outcome === "accepted") {
      showToast("Install started");
      return;
    }

    showToast("Install dismissed");
  }

  function handleGithub() {
    window.open(
      "https://github.com/FrodeHus/QRHolmes",
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="home-screen">
      <section className="hero-panel">
        <div className="qrh-eyebrow">
          <span />
          QR Inspector
          <span />
        </div>
        <LogoHeader />
        <h1>
          See what hides behind the QR-code <strong>before you tap</strong>
        </h1>
      </section>

      <section className="home-stage" aria-label="Start inspection">
        <button type="button" className="inspect-button" onClick={onInspect}>
          <span className="button-sheen" aria-hidden="true" />
          <span className="magnifier-icon" aria-hidden="true" />
          <span>Inspect QR-code</span>
        </button>
        <div className="flow-hint" aria-label="Inspection flow">
          <span>Point</span>
          <b>-&gt;</b>
          <span>Reveal</span>
          <b>-&gt;</b>
          <span>Decide</span>
        </div>
      </section>

      <footer className="home-footer" aria-label="More options">
        <button type="button" className="ghost-button" onClick={onPrivacy}>
          <span className="shield-icon" aria-hidden="true" />
          Privacy
        </button>
        <button type="button" className="ghost-button" onClick={handleGithub}>
          <span className="github-dot" aria-hidden="true" />
          GitHub
          <span className="arrow-out" aria-hidden="true" />
        </button>
      </footer>

      {showInstall ? (
        <section className="install-card" aria-label="Install QRHolmes">
          <div className="install-icon" aria-hidden="true">
            +
          </div>
          <div>
            <h2>Add to Home Screen</h2>
            <p>
              {installPrompt
                ? "Inspect codes in one tap. Works offline."
                : manualInstallCopy?.summary}
            </p>
            {installHelp && manualInstallCopy ? (
              <p className="install-help">{manualInstallCopy.details}</p>
            ) : null}
          </div>
          <button type="button" onClick={handleInstall}>
            {installPrompt ? "Install" : "How"}
          </button>
          <button
            type="button"
            className="dismiss-install"
            onClick={() => {
              setShowInstall(false);
              setInstallHelp(false);
            }}
            aria-label="Dismiss"
          >
            x
          </button>
        </section>
      ) : null}

      <div className={`toast ${toast ? "toast-show" : ""}`} role="status">
        {toast}
      </div>
    </main>
  );
}
