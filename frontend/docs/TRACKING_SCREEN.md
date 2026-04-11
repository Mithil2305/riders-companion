# Tracking Screen

## Route
- app/tracking.tsx

## Purpose
- Displays social graph lists for followers and following.
- Lets users switch tabs and toggle follow state directly from list rows.

## Architecture
- Screen: app/tracking.tsx
- Hook: src/hooks/useTrackingData.ts
- Components:
  - src/components/tracking/TabSwitcher.tsx
  - src/components/tracking/UserListItem.tsx
  - src/components/common/SkeletonBlock.tsx
  - src/components/common/EmptyState.tsx

## Data Source
- Mock followers/following:
  - src/utils/mocks/tracking.ts
- Types:
  - src/types/profile.ts (TrackerUser)

## UI Structure
1. Header row
- Back action, "Trackers" title, and icon.

2. Tab switcher
- Followers and Following tabs with item counts.
- Active tab style and animated indicator.

3. User list
- FlatList of tracker rows.
- Each row shows avatar, identity text, and follow/unfollow action.

## Query Param Behavior
- Reads `tab` from route params.
- Supported values:
  - followers
  - following
- Defaults to followers for unknown values.

## Animations
- List container transitions with directional fade-in when switching tabs.
- Row-level entrance animation in UserListItem.

## Loading and Empty States
- Skeleton rows while tracking data initializes.
- EmptyState shown when the active tab has no users.

## Theme Rules
- useTheme() drives all tokens (colors, spacing, typography, icon sizes).
- StyleSheet-only implementation.

## Future Extension
- Replace mock lists with API pagination.
- Add pull-to-refresh and follow mutation optimism with rollback.
- Add filter/sort controls for rider discovery quality.
