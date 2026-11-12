# Platform and privacy

## Platform strategy

Use one Expo/React Native codebase.

| Platform | Phase | Persistence | Notes |
|---|---|---|---|
| Android | Phase 1 | Expo SQLite | Primary target |
| Web | Phase 2 | Browser storage adapter | Same app, responsive UI |
| iOS | Phase 3 | Expo SQLite | Same shared codebase |

Do not create a separate web application. Build the web target from the same
Expo codebase.

## Local-first rules

- The app must work without an internet connection.
- Creating and viewing memories must not require an account.
- Photos are copied into app-managed storage; never rely on a camera-roll URI remaining valid.
- Generate thumbnails for performance.
- Store original media files in app-private storage.
- Provide export before adding any cloud dependency.

## Privacy rules

- No analytics in v1.
- No crash reporting in v1.
- No ads.
- No third-party tracking.
- No automatic cloud upload.
- No public sharing by default.
- Do not request contacts, location, microphone, or camera permissions unless a feature requires them.
- Request photo-library permission only when the user chooses to import media.
- Explain why a permission is needed.
- Make data deletion explicit and irreversible only after confirmation.

## Permissions

### Android

Request only when needed:

- Read media images and videos
- Optional camera access
- Optional notifications

### iOS

Configure usage descriptions for:

- Photo library access
- Camera access, if implemented
- Notifications, if implemented

## Data ownership

The user owns their data.

Provide:

- JSON export
- Markdown export
- ZIP export with media files
- PDF memory-book export
- Import from a previous JSON backup

## Error handling

Handle these cases explicitly:

- Permission denied
- Photo import canceled
- Unsupported media type
- Insufficient storage
- Database migration failure
- Export failure
- Missing or deleted media file
- Invalid date input
- Empty required fields

## Accessibility

- Minimum touch target: 44 x 44 points.
- Provide text labels for icon-only buttons.
- Support dynamic type where practical.
- Maintain sufficient color contrast.
- Ensure screen-reader labels for photos and actions.
- Avoid relying on color alone to convey meaning.