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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **QRHolmes** (127 symbols, 154 relationships, 2 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/QRHolmes/context` | Codebase overview, check index freshness |
| `gitnexus://repo/QRHolmes/clusters` | All functional areas |
| `gitnexus://repo/QRHolmes/processes` | All execution flows |
| `gitnexus://repo/QRHolmes/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
