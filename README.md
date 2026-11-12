# Foster Memories

Foster Memories is a private, local-first mobile app for preserving the story of
each pet you foster.

Instead of leaving foster photos scattered across your camera roll, create a
timeline for every foster pet: arrival, progress, funny moments, milestones,
personality, setbacks, and the goodbye.

## Why this app exists

Fostering often creates a meaningful but temporary relationship. The goal is to
preserve the pet’s story without turning it into a shelter-management system.

The app is designed for one person to use privately on their phone.

## Core features

- Create a profile for each foster pet
- Add dated memories with photos, notes, tags, and moods
- Track milestones such as “first full meal,” “first tail wag,” or “first walk”
- Build collections such as “First Week,” “Funny Moments,” or “Farewell”
- Compare before-and-after photos
- Search memories, notes, tags, and pets
- Export a pet’s story as Markdown, JSON, or a printable memory book
- Keep all data local by default

## Non-goals

This is not intended to replace rescue-management software. It does not include:

- Organization accounts
- Foster coordinator workflows
- Adoption applications
- Volunteer management
- Donations or payments
- Public pet profiles
- Social feeds
- Cloud-only storage

## Tech stack

- Expo
- React Native
- TypeScript
- Expo Router
- Expo SQLite
- Zustand
- React Hook Form
- Zod

## Development

```bash
npm install
npx expo start
```

Run Android:

```bash
npx expo start --android
```

Run web:

```bash
npx expo start --web
```

Checks:

```bash
npm run typecheck
npm run lint
npm test
```

## Status

Milestone 1 (project foundation) is done:

- Bottom tabs: Home, Pets, Add Memory, Collections, Settings
- Create, list, view, and edit pets
- Dates shown and typed as MM-DD-YYYY, with a calendar button on Android/iOS; stored as ISO `YYYY-MM-DD`
- Pets saved in SQLite on Android (`foster-memories.db`), with versioned migrations in `src/db/migrations.ts`
- Web keeps data in memory only until Phase 2; Settings shows a notice

Memories, photos, milestones, collections, search, and export are not built yet.

## Documentation

- `docs/01-product-spec.md`
- `docs/02-data-model.md`
- `docs/03-ui-flows.md`
- `docs/04-build-plan.md`
- `docs/05-platform-and-privacy.md`