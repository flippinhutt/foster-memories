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

Milestone 2 (pet profiles) is done:

- Cover photo from the pet detail screen, using the system photo picker (no storage permission needed)
- Picked photos are copied into app storage (`<documents>/media/`); the gallery original is never changed
- Replacing a cover removes the old app copy
- Delete pet asks for confirmation, then removes the pet, its memories, milestones, media rows, and app photo copies
- Camera and microphone permissions are blocked in `app.json` (not used)

Milestone 3 (memory capture) is done:

- Add Memory tab: pick a pet, add photos, date, title, note, mood, tags (comma-separated), location, favorite
- A memory needs at least one photo or a note
- Pick several photos at once with the system picker; each is copied into app storage
- Memory detail screen with all photos, favorite toggle, edit, and delete with confirmation
- Editing can add or remove photos; removed photos' app copies are deleted after the save succeeds
- Pet detail shows the pet's memories newest first, with an "Add memory" button
- Tags are reused across memories by name, ignoring case

Milestone 4 (timeline and milestones) is done:

- Pet detail Story shows memories and milestones together, newest first, grouped by month
- Add milestone from a pet: pick a suggestion (first purr, first walk, adoption day…) or write your own
- A milestone can link to one of the pet's memories; the memory detail shows its milestone
- Pet detail Milestones list with delete (asks first; the linked memory is kept)
- Deleting a memory keeps its milestones and removes the link

Collections, search, and export are not built yet.

## Documentation

- `docs/01-product-spec.md`
- `docs/02-data-model.md`
- `docs/03-ui-flows.md`
- `docs/04-build-plan.md`
- `docs/05-platform-and-privacy.md`