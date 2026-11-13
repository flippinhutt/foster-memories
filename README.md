# Foster Memories

A private, local-first app for keeping the story of each pet you foster.

Instead of leaving foster photos scattered across your camera roll, give every
foster pet a timeline: arrival, progress, funny moments, milestones,
personality, setbacks, and the goodbye.

No account. No cloud. No ads or tracking. Your data stays on your device.

## Features

- **Pet profiles** with cover photo, arrival and departure dates, and status
- **Memories** with photos, a note, mood, tags, location, and favorites
- **Story timeline** that mixes memories and milestones, grouped by month
- **Milestones** like first purr, first walk, or adoption day, optionally linked to a memory
- **Collections** such as "First Week" or "Funny Moments", across pets
- **Search** pets, memories, milestones, and tags, with tag and favorites filters
- **Export** a pet's story as a scrapbook-style PDF, Markdown, JSON, or a ZIP with photos
- **Backup and restore** everything in one ZIP file

## Privacy

- All data is stored locally in SQLite (Android/iOS) or browser storage (web).
- Imported photos are copied into the app's private storage. Originals in your gallery are never changed or deleted.
- Photos are picked with the system photo picker; no camera, microphone, or broad storage permission.
- No analytics, crash reporting, remote config, or network calls.
- Export and backup files are only shared where you choose to send them.

## Platforms

| Platform | Status |
| --- | --- |
| Android | Main target. Fully working. |
| Web | Working. Same app, stored in the browser. Sidebar layout on wide screens. |
| iOS | Configured, not yet tested on a device. |

Web notes:

- Clearing site data erases everything. Back up first.
- Use one tab at a time.
- Exports and backups download as files. The PDF opens the print dialog.

## Install (Android)

Download the APK from [Releases](https://github.com/flippinhutt/foster-memories/releases) and sideload it.
The APK is signed with a debug key, so it is fine for sideloading but not for the Play Store.

## Development

Requires Node.js and npm. For Android, use Expo Go or an emulator.

```bash
npm install
npx expo start            # dev server
npx expo start --android  # Android
npx expo start --web      # web
```

Checks:

```bash
npm run typecheck
npm run lint
npm test
```

## Project structure

```text
app/              Expo Router screens and navigation
src/components/   Reusable UI components
src/screens/      Screen-level logic
src/db/           SQLite schema, migrations, repositories
src/services/     Media, export, backup, and file logic
src/stores/       Zustand stores
src/utils/        Pure helpers (dates, search, timeline)
docs/             Product, data model, UI, and platform docs
```

## Tech stack

Expo, React Native, TypeScript, Expo Router, Expo SQLite, Zustand,
React Hook Form, Zod, date-fns, Jest.

## CI

GitHub Actions builds an Android APK:

- `android-apk.yml`: every push to `main` and every PR. Runs checks, builds arm64 only. APK is in the run's `foster-memories-apk` artifact.
- `android-release.yml`: push a tag like `v1.0.0`. Builds all ABIs and attaches the APK to a GitHub Release.
- `versionCode` is the CI run number. Release builds add 100000, so a release APK installs over a fast build.

## Non-goals

This is a personal memory journal, not rescue-management software. It does not
include organization accounts, coordinator workflows, adoption applications,
volunteer management, payments, public profiles, social feeds, or cloud sync.

## Documentation

- [Product spec](docs/01-product-spec.md)
- [Data model](docs/02-data-model.md)
- [UI flows](docs/03-ui-flows.md)
- [Build plan](docs/04-build-plan.md)
- [Platform and privacy](docs/05-platform-and-privacy.md)

## License

[MIT](LICENSE)
