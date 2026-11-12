# Data model

## Storage approach

The app is local-first.

On Android and iOS, use SQLite through Expo SQLite. On web, use a storage
adapter; SQLite is not the web persistence layer.

All records use string UUIDs. Dates are stored as ISO 8601 strings in UTC.

## Entities

### Pet

Represents one foster animal.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| name | string | yes | Pet name |
| species | string | no | Dog, cat, rabbit, etc. |
| breed | string | no | Breed or mix |
| sex | string | no | male, female, or unknown |
| approximateAge | string | no | Free text, such as “about 2 years” |
| arrivalDate | string | no | ISO date |
| departureDate | string | no | ISO date |
| status | string | yes | active, adopted, transferred, returned, deceased, unknown |
| backstory | string | no | Where they came from and initial context |
| personality | string | no | Temperament and notable traits |
| notes | string | no | General notes |
| coverPhotoId | string | no | Media ID for profile image |
| createdAt | string | yes | ISO timestamp |
| updatedAt | string | yes | ISO timestamp |

### Memory

Represents one dated moment or story.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| petId | string | yes | Foreign key to pet |
| occurredAt | string | yes | Date the memory happened |
| title | string | no | Short headline |
| body | string | no | Story or note |
| location | string | no | Optional place |
| mood | string | no | Mood category |
| isFavorite | boolean | yes | Defaults to false |
| createdAt | string | yes | ISO timestamp |
| updatedAt | string | yes | ISO timestamp |

### Media

Represents a photo or video attached to a memory.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| memoryId | string | no | Foreign key to memory |
| petId | string | yes | Foreign key to pet |
| localUri | string | yes | App-private file URI |
| thumbnailUri | string | no | Generated thumbnail |
| mimeType | string | no | image/jpeg, video/mp4, etc. |
| width | number | no | Pixels |
| height | number | no | Pixels |
| durationSeconds | number | no | For video |
| caption | string | no | Caption |
| takenAt | string | no | Original capture date if available |
| createdAt | string | yes | ISO timestamp |

### Milestone

Represents an important event in a pet’s journey.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| petId | string | yes | Foreign key to pet |
| memoryId | string | no | Optional linked memory |
| label | string | yes | Milestone name |
| occurredAt | string | yes | Date it happened |
| category | string | no | Category label |
| notes | string | no | Details |
| createdAt | string | yes | ISO timestamp |

### Tag

A reusable label applied to memories.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| name | string | yes | Unique tag name |
| color | string | no | Optional color |

### Memory tag

Many-to-many relationship between memories and tags.

| Field | Type | Notes |
|---|---|---|
| memoryId | string | Foreign key |
| tagId | string | Foreign key |

### Collection

A user-created grouping of memories.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | yes | UUID |
| name | string | yes | Collection name |
| description | string | no | Optional description |
| sortOrder | number | yes | Display order |
| createdAt | string | yes | ISO timestamp |

### Collection memory

Many-to-many relationship between collections and memories.

| Field | Type | Notes |
|---|---|---|
| collectionId | string | Foreign key |
| memoryId | string | Foreign key |
| sortOrder | number | Display order |

## Relationships

- One pet has many memories.
- One memory belongs to one pet.
- One memory can have many media items.
- One media item may belong to one memory.
- One pet has many milestones.
- One milestone may link to one memory.
- One memory can have many tags.
- One tag can apply to many memories.
- One collection can contain many memories.
- One memory can belong to many collections.

## Important constraints

- Deleting a pet cascades to its memories, media records, and milestones.
- Deleting a memory cascades to its media, tags, and collection links.
- Deleting a media record must not delete the original photo from the device camera roll.
- Media files are copied into app-managed storage when imported.
- The app must tolerate missing or unreadable media files.