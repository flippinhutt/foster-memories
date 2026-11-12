# UI flows

## Design direction

The app should feel warm, calm, personal, and photo-forward.

It should feel like a private scrapbook or memory book, not a clinical animal
shelter database.

Use large photos, generous spacing, readable typography, and a simple
bottom-tab or drawer navigation model.

## Primary navigation

Bottom tabs:

1. Home
2. Pets
3. Add Memory
4. Collections
5. Settings

The center action is **Add Memory**.

## Home screen

Show:

- A greeting based on time of day
- Recent memories
- Active pets
- A prompt such as “Add a memory about Luna”
- A “On this day” section when prior memories exist
- Quick access to search

## Pets screen

Show:

- Grid or list of pet cards
- Cover photo
- Name
- Species
- Arrival date
- Status
- Number of memories
- Quick action to open the pet timeline

Include an empty state:

> No foster pets yet. Add your first foster to begin their story.

## Add pet flow

1. Tap “Add pet.”
2. Enter name.
3. Optionally choose species, breed, sex, and approximate age.
4. Add arrival date.
5. Add cover photo.
6. Add backstory or first impressions.
7. Save.

The only required field is the pet’s name. Do not make the user complete a long
intake form before they can save.

## Pet detail screen

Show:

- Cover photo
- Name and basic details
- Status
- Arrival date
- Days in care, if applicable
- Timeline
- Milestones
- Photos
- Collections
- Export button
- Edit button

Use segmented controls or tabs:

- Story
- Photos
- Milestones
- Collections

## Add memory flow

1. Tap the central “Add Memory” button.
2. Select a pet, or create a new pet if none exists.
3. Choose photos from the camera roll.
4. Add a title and short note.
5. Optionally add date, location, mood, and tags.
6. Save.

The minimum viable memory is:

- Pet
- Date
- At least one photo or a note

Everything else is optional.

## Memory detail screen

Show:

- Photos or video
- Date
- Title
- Note
- Tags
- Mood
- Location
- Linked milestone
- Edit action
- Favorite action
- Share/export action

## Milestone flow

1. Open a pet.
2. Tap “Add milestone.”
3. Choose a preset milestone or create a custom one.
4. Set the date.
5. Optionally attach a memory or photo.
6. Save.

## Search flow

1. Tap search.
2. Enter a term.
3. Show grouped results:
   - Pets
   - Memories
   - Milestones
   - Tags
4. Tap a result to open it.

## Export flow

1. Open a pet.
2. Tap “Export.”
3. Choose format:
   - PDF memory book
   - Markdown
   - JSON backup
   - ZIP archive with photos
4. Choose date range or selected memories, if applicable.
5. Generate the export.
6. Share or save the file.

## Settings screen

Include:

- Theme: system, light, dark
- Photo storage location
- Export default format
- Backup location
- Reminder preferences
- Data export
- Delete all data, with confirmation

## Empty states

Use friendly, specific empty states:

- No pets: “Add your first foster to begin their story.”
- No memories: “Capture their first day, a funny moment, or a small win.”
- No search results: “Try a pet name, tag, or phrase from a memory.”
- No collections: “Create a collection such as ‘First Week’ or ‘Farewell.’”