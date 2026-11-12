# Build plan

Build in small, testable increments. Do not attempt to implement every feature
at once.

## Phase 1: Android local memory journal

### Milestone 1: Project foundation

Create:

- Expo project
- TypeScript configuration
- Expo Router navigation
- Theme tokens
- SQLite database connection
- Initial migration
- Zustand stores
- Basic Home, Pets, Settings, and Add Memory screens

Acceptance criteria:

- App launches on Android.
- Bottom navigation works.
- TypeScript and lint pass.
- Database initializes and migrations run.
- A pet can be created and persists after app restart.

### Milestone 2: Pet profiles

Implement:

- Pet creation form
- Pet list
- Pet detail page
- Pet editing
- Cover photo selection
- Pet status
- Arrival and departure dates
- Delete pet with confirmation

Acceptance criteria:

- User can create, edit, view, and delete a pet.
- Cover photo persists locally.
- Deleting a pet removes related records safely.
- Empty state is shown when no pets exist.

### Milestone 3: Memory capture

Implement:

- Add Memory screen
- Photo picker
- Local media copy
- Multiple photos per memory
- Memory title and body
- Date picker
- Mood selector
- Tag input
- Favorite toggle
- Memory detail view
- Memory editing
- Memory deletion

Acceptance criteria:

- User can create a memory with one or more photos.
- User can create a text-only memory.
- Photos remain available after restart.
- Memory appears in the pet timeline.
- User can edit and delete a memory.

### Milestone 4: Timeline and milestones

Implement:

- Reverse-chronological pet timeline
- Date grouping
- Milestone creation
- Preset milestone suggestions
- Custom milestones
- Linking a milestone to a memory
- Milestone list view

Acceptance criteria:

- Timeline displays memories and milestones in date order.
- User can add and delete milestones.
- Milestone can link to an existing memory.

### Milestone 5: Collections and search

Implement:

- Collections CRUD
- Add/remove memories from collections
- Collection detail view
- Search across pets, memories, notes, tags, and milestones
- Tag filtering
- Favorites filter

Acceptance criteria:

- User can create, rename, and delete collections.
- User can add and remove memories from a collection.
- Search returns relevant results.
- Filters work without errors.

### Milestone 6: Export and backup

Implement:

- Markdown export
- JSON export
- ZIP archive export
- PDF memory-book export
- Share sheet integration
- Export progress and error states

Acceptance criteria:

- User can export a pet’s full story.
- Export includes selected photos where applicable.
- Exported files can be shared from Android.
- App remains usable during export.

## Phase 2: Web companion

Enable the same Expo app for web.

Add:

- Responsive layouts
- Desktop navigation
- Photo drag-and-drop import
- Keyboard-friendly memory editor
- Bulk photo selection
- Browser-compatible persistence adapter
- Downloadable exports
- Larger-screen photo grid

Acceptance criteria:

- Same core features work in the browser.
- User can import, view, edit, and export memories.
- Mobile and web use the same domain models and business logic.
- No separate web-only data model is created.

## Phase 3: iOS compatibility

Add iOS as a supported platform.

Tasks:

- Test all screens on an iPhone or iOS simulator.
- Handle iOS photo-library permissions.
- Handle safe-area insets and keyboard behavior.
- Configure app icons and splash screens.
- Configure bundle identifier and privacy usage descriptions.
- Build with EAS Build.
- Test on a physical iPhone.
- Prepare TestFlight distribution.

Acceptance criteria:

- Core flows work on iOS.
- Photo import, local storage, export, and navigation work.
- App meets Apple privacy and permission requirements.
- No Android-only assumptions remain in shared code.

## Explicitly out of scope

Do not build:

- Authentication
- Organizations
- Foster coordinator roles
- Multi-user collaboration
- Rescue management
- Adoption pipelines
- Donations
- Public pet profiles
- Social features
- Cloud-only storage
- Ads
- Analytics
- Third-party AI integrations