# Repository Guidelines

## Project Structure & Module Organization

This repository is being initialized as QRHolmes, a static Vite PWA for client-side QR inspection. The approved design lives in `docs/superpowers/specs/2026-06-05-qrholmes-pwa-design.md`. The transparent logo source is `qrholmes.png` in the repository root.

Expected implementation layout:

- `src/` for application code, UI components, scanner logic, payload parsing, defanging, and short-link expansion.
- `public/` for static PWA assets, manifest files, generated icons, and files served unchanged.
- `tests/` or colocated `*.test.ts` / `*.test.tsx` files for focused unit tests.

Keep QR parsing, defanging, and network expansion logic separate from UI components so behavior is testable without a browser camera.

## Build, Test, and Development Commands

No package scripts exist yet. Once the Vite project is scaffolded, use standard npm scripts:

- `npm install` installs dependencies.
- `npm run dev` starts the local development server.
- `npm run build` creates the static production build.
- `npm test` runs the test suite.
- `npm run lint` runs lint checks, if configured.

Do not add backend, proxy, or server-function requirements. The app must remain hostable as static files.

## Coding Style & Naming Conventions

Use TypeScript for application logic. Prefer small modules with explicit names such as `parsePayload.ts`, `defangUrl.ts`, and `shortenerResolver.ts`. Use React components with `PascalCase` filenames, for example `InspectButton.tsx`. Use two-space indentation and keep code formatted through the project formatter once configured.

Security-sensitive UI text should avoid saying a URL is “safe.” Say what was observed, parsed, expanded, or blocked.

## Testing Guidelines

Add tests for payload parsing, URL defanging, shortener detection, expansion state handling with mocked fetch behavior, and action behavior. `Copy` and `Open` must use original payload values, not defanged display strings. Test files should follow `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines

Current history uses concise imperative commits, for example `Add QRHolmes PWA design spec`. Continue that style.

Pull requests should include a short summary, test results, screenshots for UI changes, and notes about privacy-impacting behavior. Call out any new outbound network request explicitly.

## Security & Privacy Requirements

All QR inspection runs client-side. Do not send QR contents to the hosting provider. Short-link expansion, URL opening, and future VirusTotal checks must require explicit user action and clear disclosure.
