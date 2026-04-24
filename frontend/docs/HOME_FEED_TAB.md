# Home Feed Tab

## Route
- app/(tabs)/index.tsx

## Purpose
- Displays rider stories and feed posts in a high-performance vertical stream.
- Uses local mock data only for now.

## Architecture
- Screen: app/(tabs)/index.tsx
- Hook: src/hooks/useHomeFeed.ts
- Components:
  - src/components/feed/HeaderBar.tsx
  - src/components/feed/StoryItem.tsx
  - src/components/feed/FeedPost.tsx
  - src/components/feed/FeedSkeleton.tsx
  - src/components/common/IconButton.tsx
  - src/components/common/EmptyState.tsx

## Data Source
- Mock stories and posts:
  - src/utils/mocks/feed.ts
- Types:
  - src/types/feed.ts

## UI Structure
1. Header section
- Brand title and notification action.

2. Stories section (horizontal)
- Circular story items.
- First item is Add Story.
- Horizontal snap behavior.

3. Feed section (vertical)
- FlatList of post cards.
- Pull-to-refresh simulation.

## Post Card Details
- Header: avatar, username, time, menu action.
- Media: full-width image with lazy-loading indicator.
- Actions: like, comment, share, bookmark.
- Meta: likes count, caption preview, comment prompt.

## Animations
- Post item entry: fade + slide up.
- Like action: scale + color pop.
- Image interaction: subtle zoom on press.
- Story action: press scale feedback.

## Loading and Empty States
- Initial loading skeleton while mock feed hydrates.
- EmptyState shown if posts array is empty.

## Theme Rules
- All colors/spacing/typography are sourced from useTheme().
- No hardcoded styling tokens.
- StyleSheet-only styling.

## Performance Notes
- Uses FlatList for virtualization.
- Stable keyExtractor and memoized renderItem callbacks.
- Lightweight presentational components with logic moved to hook.

## Future Extension
- Replace mock data in useHomeFeed with FeedService integration.
- Add pagination and optimistic updates for interactions.
