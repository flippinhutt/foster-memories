# Foster Memories

Foster Memories is a private, local-first Android app for preserving the story
of each pet I foster: photos, notes, milestones, quirks, progress, and farewell
memories.

This is **not** an animal-rescue management app. It is a personal memory journal
for one user. Do not add organizations, foster coordinators, volunteer
management, adoption pipelines, public profiles, payments, or social features.

## Product principles

1. Local-first: all user data must work offline and remain on the device by default.
2. Private by default: no account, cloud sync, analytics, ads, or telemetry in v1.
3. Memory-first: the primary object is a dated memory, not a medical record.
4. Fast capture: adding a photo and a short note must take only a few taps.
5. Exportable: users must always be able to export their data; no vendor lock-in.
6. Respectful: foster stories can include sensitive personal or animal-welfare details.

## Target platforms

Build with Expo, React Native, TypeScript, and Expo Router.

- Phase 1: Android
- Phase 2: Web version of the same app
- Phase 3: iOS compatibility and release readiness

Use one shared codebase for all platforms. Do not create a separate React web
application.

## Stack

- Expo SDK with React Native and TypeScript
- Expo Router for navigation
- Expo SQLite for local relational storage on Android/iOS
- Zustand for lightweight global UI state
- React Hook Form and Zod for forms and validation
- Expo Image Picker and Expo FileSystem for photo import and local media storage
- date-fns for date formatting
- Jest and React Native Testing Library for tests

For web, use a storage adapter rather than calling Expo SQLite directly from UI
components. On Android/iOS, use SQLite. On web, use an IndexedDB/OPFS-compatible
adapter or clearly stub persistence until the web phase.

## Commands

Run these from the repository root:

- `npm install`
- `npx expo start`
- `npx expo start --android`
- `npx expo start --ios`
- `npx expo start --web`
- `npm run typecheck`
- `npm run lint`
- `npm test`

Before declaring a task complete, run:

```bash
npm run typecheck
npm run lint
npm test
```

## Project structure

- `app/` — Expo Router screens and navigation
- `src/components/` — reusable presentational components
- `src/screens/` — screen-level composition and page logic
- `src/db/` — SQLite schema, migrations, and repository functions
- `src/services/` — media, export, backup, search, and reminder logic
- `src/stores/` — Zustand stores
- `src/types/` — shared TypeScript types
- `src/utils/` — pure helpers
- `src/theme/` — colors, spacing, typography
- `docs/` — product, data-model, UI, build, and platform documentation

## Coding rules

- Use TypeScript strict mode.
- Do not use `any`; use explicit types or `unknown` with validation.
- Use functional React components and hooks.
- Keep screens thin; place reusable logic in services, repositories, or hooks.
- Use UUIDs generated on the client for local records.
- Store dates as ISO 8601 strings in UTC.
- Store IDs as strings.
- Never delete photos from the device camera roll; copy imported media into the app’s private storage area.
- Handle photo permissions gracefully and explain why permission is needed.
- Design for offline use; do not block UI on network calls.
- Use accessible touch targets, labels, and sufficient color contrast.
- Do not add analytics, crash reporting, remote config, ads, or cloud dependencies unless explicitly requested.

## Data rules

Core entities:

- `pets`
- `memories`
- `media`
- `milestones`
- `tags`
- `memory_tags`
- `collections`
- `collection_memories`

A pet has many memories. A memory may contain multiple photos or videos.
Milestones may link to a memory. Collections group memories across pets or
within one pet.

Do not create a `foster_placements` table in v1. The pet’s `status`,
`arrivalDate`, and `departureDate` are sufficient for the personal use case.

## Definition of done

A feature is complete when:

- It works on Android and does not break the web target.
- TypeScript, ESLint, and tests pass.
- Data persists across app restarts.
- Photos remain accessible after an app restart.
- Empty, loading, error, and permission-denied states are handled.
- New database changes include an idempotent migration.
- User-facing text is concise and friendly.
- No secrets, API keys, or personal data are committed.

## Current phase

Implement Phase 1 only unless I explicitly ask for another phase.

Phase 1 scope:

- Pet profiles
- Memory timeline
- Photo import and local storage
- Notes, tags, moods, and favorites
- Milestones
- Collections
- Search
- Local export
- Android-first UI

Do not implement cloud sync, authentication, iOS store configuration, or a
separate backend unless I ask.