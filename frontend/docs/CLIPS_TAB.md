# Clips Tab

## Route

- app/(tabs)/clips.tsx

## Purpose

- Delivers a vertically paged short-video style experience for ride highlights.
- Emphasizes immersive media with right-rail social actions and bottom metadata.

## Architecture

- Screen: app/(tabs)/clips.tsx
- Hook: src/hooks/useClipsFeed.ts
- Types:
  - src/types/clips.ts

## Data Source

- Clips dataset from hook layer (mock-backed in current implementation).
- Per-session like state managed locally in screen state.

## UI Structure

1. Full-screen clip canvas

- Each clip occupies viewport height.
- Background media image with full-bleed rendering.

2. Visual overlay

- Gradient overlay improves text readability.
- Top-right hint action icon.

3. Right action rail

- Avatar, like, comments, and share clusters.
- Like uses custom icon assets and toggles local state.

4. Bottom metadata

- Username, caption, and music line with icon.

## Scroll and Playback Index Logic

- FlatList uses paging and snap-to-interval behavior.
- Active index is computed on momentum end and passed to hook via setActiveIndex.
- Dynamic item layout recalculates when container height changes.

## Interactions

- Like toggle updates local liked map keyed by clip id.
- Count display updates immediately (optimistic UI behavior).

## Theme Rules

- useTheme() tokens control dimensions, colors, typography, and spacing.
- Safe-area insets are applied to top and bottom anchored elements.

## Performance Notes

- getItemLayout is provided for predictable virtualization.
- keyExtractor and memoized callbacks keep list rendering stable.

## Future Extension

- Replace static media with streamed video playback.
- Add prefetching and memory-aware cache strategy.
- Connect actions (like/comment/share) to backend services with optimistic sync.
