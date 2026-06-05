<p align="center">
  <img src="./QR-Holmes.png" alt="QRHolmes logo" width="170" />
</p>

# QRHolmes

Peek behind a QR code before you tap.

QRHolmes is a small, static PWA for checking what a QR code contains. Scan a code, see the raw payload, get the useful bits pulled out, and decide what to do next.

## What it does

- Scans QR codes in the browser with your camera.
- Shows the original payload without sending it anywhere.
- Defangs URLs in the UI so they are easier to inspect without accidental clicks.
- Parses common QR payloads like URLs, email, phone numbers, SMS, Wi-Fi configs, deep links, and plain text.
- Lets you copy the original value or open the real target when you choose.
- Works as an installable PWA when the browser supports it.

## Privacy

The scanner runs locally in your browser. QR contents are not sent to the hosting provider.

Network requests only happen when you choose actions that need them:

- opening a link contacts the destination

Copying a payload does not make a network request.

## Run it locally

```bash
npm install
npm run dev
```

Build the static app:

```bash
npm run build
```

Run checks:

```bash
npm test
npm run lint
```

## Production Docker image

Build and run the production container:

```bash
docker build -t qrholmes .
docker run --rm -p 8080:80 qrholmes
```

Then open `http://localhost:8080`.

## Project shape

- `src/components` - app screens and UI pieces
- `src/lib` - QR payload parsing, defanging, and actions
- `public` - static PWA assets
- `scripts/generate-icons.mjs` - icon generation
- `Dockerfile` and `nginx.conf` - production static hosting

## A note on "safe"

QRHolmes helps you inspect what was scanned. It does not certify links, block malware, or replace judgment. The app shows what it can observe and keeps the final tap in your hands.
