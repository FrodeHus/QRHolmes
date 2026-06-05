import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';

interface ScannerScreenProps {
  onCancel: () => void;
  onDetected: (rawPayload: string) => void;
}

type ScannerStatus = 'starting' | 'scanning' | 'denied' | 'unavailable' | 'decode-error';

export default function ScannerScreen({ onCancel, onDetected }: ScannerScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>('starting');

  useEffect(() => {
    let active = true;

    function stopCamera() {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    function scanFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!active || detectedRef.current) {
        return;
      }

      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameRef.current = window.requestAnimationFrame(scanFrame);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        setStatus('decode-error');
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);

      if (code?.data) {
        detectedRef.current = true;
        stopCamera();
        onDetected(code.data);
        return;
      }

      frameRef.current = window.requestAnimationFrame(scanFrame);
    }

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('scanning');
          scanFrame();
        }
      } catch (error) {
        const name = error instanceof DOMException ? error.name : '';
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      }
    }

    void startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [onDetected]);

  return (
    <main className="scanner-screen">
      <div className="scanner-topbar">
        <button type="button" className="link-button scanner-cancel" onClick={onCancel}>
          Cancel
        </button>
        <span>{scannerMessage(status)}</span>
      </div>
      <div className="scanner-frame">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="scanner-reticle" aria-hidden="true" />
      </div>
      <p className="scanner-help">{scannerHelp(status)}</p>
    </main>
  );
}

function scannerMessage(status: ScannerStatus): string {
  switch (status) {
    case 'starting':
      return 'Starting camera';
    case 'scanning':
      return 'Looking for QR code';
    case 'denied':
      return 'Camera permission denied';
    case 'unavailable':
      return 'Camera unavailable';
    case 'decode-error':
      return 'Could not read camera frame';
  }
}

function scannerHelp(status: ScannerStatus): string {
  switch (status) {
    case 'starting':
      return 'Your browser will ask for camera access when needed.';
    case 'scanning':
      return 'Hold the QR code inside the frame.';
    case 'denied':
      return 'Allow camera access in browser settings, then try again.';
    case 'unavailable':
      return 'This browser or device does not expose a camera API here.';
    case 'decode-error':
      return 'The browser provided a camera frame that could not be inspected.';
  }
}
