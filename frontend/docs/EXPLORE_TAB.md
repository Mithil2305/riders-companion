# Explore Tab

## Route
- app/(tabs)/explore.tsx

## Purpose
- Helps users discover riders, rooms, and trending clips.
- Uses local mock data with client-side query filtering.

## Architecture
- Screen: app/(tabs)/explore.tsx
- Hook: src/hooks/useExploreData.ts
- Components:
  - src/components/explore/SearchBar.tsx
  - src/components/explore/UserCard.tsx
  - src/components/explore/RoomCard.tsx
  - src/components/explore/ClipCard.tsx
  - src/components/common/EmptyState.tsx

## Data Source
- Mock users, rooms, and clips:
  - src/utils/mocks/explore.ts
- Types:
  - src/types/explore.ts

## UI Structure
1. Search header
- Title row and animated rounded SearchBar.

2. Suggested Riders
- Horizontal FlatList of rider cards.
- Includes Follow CTA.

3. Suggested Rooms
- Vertical room cards with members count and Join CTA.

4. Trending Clips
- 2-column grid using FlatList with numColumns.
- Play icon overlay on thumbnails.

## Animations
- SearchBar: focus glow + subtle expand.
- Riders/rooms/clips: staggered fade-in entrances.
- Buttons: press scale feedback.
- Clip tiles: slight zoom on press.

## Empty States
- Riders section empty message when search has no user match.
- Rooms section empty message when search has no room match.
- Clips empty message when no clips are available.

## Theme Rules
- useTheme() for all color, spacing, typography values.
- StyleSheet-only styling.
- Compatible with light and dark modes.

## Performance Notes
- FlatList for horizontal riders and 2-column clips.
- Memoized render callbacks.
- Section composition keeps re-render cost low.

## Future Extension
- Add backend search endpoints via service layer.
- Add ranking/trending score and clip playback preview.
- Add debounced search in hook if remote querying is introduced.
