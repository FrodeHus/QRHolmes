# QRHolmes PWA Design

Date: 2026-06-05

## Goal

Build QRHolmes as a simple static Progressive Web App that can be installed on modern mobile phones. The app inspects QR code contents without sending scan data to the hosting provider. All scan parsing, display, and user actions run client-side in the installed PWA.

## Target Platforms

QRHolmes targets modern iOS and Android browsers:

- Safari on iOS
- Chrome on Android and iOS
- Edge Chromium on Android and iOS
- Firefox on Android and iOS

Camera scanning requires a secure context, so production hosting must use HTTPS. The app should degrade cleanly when a browser denies camera permission or lacks a required media API.

## Architecture

The app will be a static Vite PWA. It can be hosted by any static host because it does not require a backend, server functions, or server-side storage.

Core modules:

- App shell and routing: handles the home, scanner, result, and settings-like flows.
- Scanner: opens the device camera through browser APIs and decodes QR codes locally.
- Payload parser: classifies QR content as URL, app/deep link, Wi-Fi QR string, email, telephone, SMS, or plain text.
- Defanger: renders potentially dangerous text safely for inspection.
- Short-link resolver: performs explicit, user-triggered short URL expansion from the device.
- PWA assets: manifest, service worker, install icons, and offline app shell caching.

The transparent `qrholmes.png` file in the project root is the brand source. It will be used in the top logo and processed into the required install icon sizes if its dimensions are suitable.

## User Flow

The home screen shows the QRHolmes logo at the top and a large round `Inspect QR` button. Tapping the button opens the scanner view and asks for camera permission only when needed.

When a QR code is detected, the app navigates to the result view. The result view shows:

- Payload type
- Safe defanged display content
- Parsed details where useful, such as URL parts or Wi-Fi fields
- Short-link expansion controls when the payload is a known short URL
- Bottom action buttons

The result page must not automatically open links, copy data, expand short links, submit URLs, or perform any network lookup.

## Safe Display And Actions

Displayed QR content is defanged so it is readable but not accidentally clickable. Example URL display:

```text
https[:]//example[.]com/path
```

The defanged display is presentation-only. Explicit actions use the original parsed payload:

- `Copy` is always shown and copies the original QR payload, not the defanged text.
- `Open` is shown when the payload contains something the browser or operating system can attempt to open, such as HTTP(S), custom app URLs, email, telephone, or SMS links.
- `Open` uses the original URL or link value, not the defanged display value.

For Wi-Fi QR payloads, the app displays and copies the original data. It should not promise automatic Wi-Fi joining because PWAs cannot reliably join Wi-Fi networks across iOS and Android browsers.

## Short-Link Expansion

If the QR content is a URL using a known shortener domain, the app first shows only the defanged short URL. No network request is made until the user taps `Expand short link`.

Expansion is best-effort and client-side:

1. Use provider-supported preview behavior first when known.
2. If no preview behavior applies, attempt a `HEAD` request to observe redirects where browser CORS and redirect handling allow it.
3. If `HEAD` fails, attempt controlled fallback requests where the browser permits them.
4. Show the redirect chain when observable.
5. Defang every displayed URL in the chain.
6. State plainly when the browser blocks inspection or the final target cannot be confirmed.

Known provider behavior to support in v1:

- TinyURL: use preview URLs such as `https://tinyurl.com/preview/<alias>` when applicable.
- is.gd: support preview discovery by appending `-` to the short link.
- v.gd: treat as a preview-first service because v.gd displays a preview page by default.
- Bitly and common Bitly domains: prefer any documented checker or preview behavior if it can work client-side, otherwise fall back to redirect probing.
- Other known shortener domains: detect them and use redirect probing.

The app should avoid claiming a URL is safe. It only reports what was scanned, parsed, expanded, or blocked.

## Privacy Model

The hosting provider receives requests for static app files only. QR payloads are not sent to the hosting provider.

Client-side network requests may still reveal information to third parties:

- Expanding a short link contacts the shortener and may reveal the device IP, user agent, and the specific short URL.
- Opening a URL contacts the destination.
- Copying does not make a network request.

The UI must keep outbound actions explicit so the user controls when data leaves the device.

## Error Handling

The app should handle:

- Camera permission denied
- Camera unavailable
- No QR code found yet
- QR decode errors
- Unsupported payload types
- Invalid URLs
- Short-link expansion blocked by CORS
- Short-link expansion timeout
- Redirect loops or excessive redirect depth

Errors should be written in plain language and avoid implying safety when the app could not verify something.

## V2: Optional VirusTotal Integration

VirusTotal is not part of v1.

In v2, QRHolmes can add an optional user-provided VirusTotal API key flow. The app should explain:

```text
If you want QRHolmes to check whether a URL is a known threat, you need to sign up for VirusTotal.
```

The guided flow should show how to:

- Create or sign in to a VirusTotal account.
- Find the user's API key.
- Store the key locally in the app.
- Remove the key from local storage.
- Run an explicit `Check VirusTotal` action for a final target URL.

No VirusTotal API key will be bundled with the app. No URL will be sent to VirusTotal automatically. VirusTotal checks may be blocked by browser CORS because v2 remains client-side-only.

## Testing

V1 should include focused tests for:

- Payload parsing
- URL defanging
- Shortener detection
- Short-link expansion state transitions with mocked network behavior
- Action behavior ensuring `Copy` and `Open` use original values

Manual browser verification should cover:

- PWA installability
- Camera permission flow
- QR scanning on at least one desktop browser with a camera or mocked stream
- Mobile layout at common iOS and Android viewport sizes
- Offline app shell loading after first visit
