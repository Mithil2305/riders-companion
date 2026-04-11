# Notifications Screen

## Route
- app/notifications.tsx

## Purpose
- Provides a centralized stream of rider activity updates and system alerts.
- Supports mark-as-read and dismissal actions at item level.

## Architecture
- Screen: app/notifications.tsx
- Hook: src/hooks/useNotificationsData.ts
- Components:
  - src/components/notifications/NotificationItem.tsx
  - src/components/common/SkeletonBlock.tsx
  - src/components/common/EmptyState.tsx

## Data Source
- Mock notification records:
  - src/utils/mocks/notifications.ts
- Types:
  - src/types/notifications.ts

## UI Structure
1. Header row
- Back action and title with notification icon.

2. Notifications list
- FlatList of NotificationItem rows.
- Rows include iconography, body text, timestamp, and status cues.

## Gestures and Actions
- Swipe-to-dismiss interaction is handled inside NotificationItem.
- Tap interaction marks unread items as read.
- Dismiss updates list state through hook action.

## Critical Integration Note
- Since NotificationItem uses GestureDetector, app root must be wrapped in GestureHandlerRootView.
- Root wrapper location:
  - app/_layout.tsx

## Loading and Empty States
- Skeleton cards during loading.
- EmptyState when there are no notifications.

## Theme Rules
- useTheme() powers all visual tokens and spacing.
- Consistent rounded card style with border and surface contrast.

## Future Extension
- Integrate backend push/inbox service.
- Add grouped sections (Today, This Week, Older).
- Add bulk actions: mark all as read, clear all.
