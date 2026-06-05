import LogoHeader from './LogoHeader';

interface HomeScreenProps {
  onInspect: () => void;
  onPrivacy: () => void;
}

export default function HomeScreen({ onInspect, onPrivacy }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <LogoHeader />
      <section className="home-stage" aria-label="Start inspection">
        <button type="button" className="inspect-button" onClick={onInspect}>
          <span>Inspect QR</span>
        </button>
      </section>
      <footer className="home-footer">
        <button type="button" className="link-button" onClick={onPrivacy}>
          Privacy
        </button>
      </footer>
    </main>
  );
}
