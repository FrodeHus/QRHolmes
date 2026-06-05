import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import PrivacyScreen from './components/PrivacyScreen';
import ResultScreen from './components/ResultScreen';
import ScannerScreen from './components/ScannerScreen';

type Screen =
  | { name: 'home' }
  | { name: 'scanner' }
  | { name: 'result'; rawPayload: string }
  | { name: 'privacy' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  if (screen.name === 'scanner') {
    return (
      <ScannerScreen
        onCancel={() => setScreen({ name: 'home' })}
        onDetected={(rawPayload) => setScreen({ name: 'result', rawPayload })}
      />
    );
  }

  if (screen.name === 'result') {
    return <ResultScreen rawPayload={screen.rawPayload} onScanAgain={() => setScreen({ name: 'scanner' })} />;
  }

  if (screen.name === 'privacy') {
    return <PrivacyScreen onBack={() => setScreen({ name: 'home' })} />;
  }

  return <HomeScreen onInspect={() => setScreen({ name: 'scanner' })} onPrivacy={() => setScreen({ name: 'privacy' })} />;
}
