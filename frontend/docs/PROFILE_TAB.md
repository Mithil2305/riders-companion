# Profile Tab

## Route
- app/(tabs)/profile.tsx

## Purpose
- Presents the rider profile dashboard with quick actions and section-based content.
- Centralizes profile identity, ride stats, tracker entry points, achievements, and garage.

## Architecture
- Screen: app/(tabs)/profile.tsx
- Hook: src/hooks/useProfileDashboardData.ts
- Components:
  - src/components/profile/ProfileHeader.tsx
  - src/components/profile/StatsCard.tsx
  - src/components/profile/BadgeItem.tsx
  - src/components/profile/BikeCard.tsx
  - src/components/common/PrimaryButton.tsx
  - src/components/common/SkeletonBlock.tsx
  - src/components/common/EmptyState.tsx

## Data Source
- Mock profile, badges, and bikes:
  - src/utils/mocks/profile.ts
- Types:
  - src/types/profile.ts

## UI Structure
1. Hero area
- Cover image with floating top actions.
- Notifications and settings quick-access actions.

2. Profile summary
- Avatar + identity block via ProfileHeader.
- Edit Profile primary action.

3. Metrics and social entry
- StatsCard for miles, speed, and ride count.
- Trackers and Tracking shortcut buttons route to tracking screen with tab preselection.

4. Section tabs
- Three content views:
  - Triumphs: progress toward mileage milestone.
  - Badges: achievement grid.
  - Garage: bike list with add-vehicle CTA.

## Interactions and Navigation
- Notifications button: routes to /notifications.
- Settings button: routes to /settings.
- Edit Profile: routes to /setup/profile.
- Trackers button: routes to /tracking?tab=followers.
- Tracking button: routes to /tracking?tab=following.

## Animations
- Section card transitions use FadeInDown.
- Badge items animate in with per-index delay.
- Loading skeletons for hero and content while data hydrates.

## Loading and Empty States
- Full skeleton screen during initial load.
- Garage section uses EmptyState when no bikes are available.

## Theme Rules
- All spacing, colors, radius, and typography values are sourced from useTheme().
- StyleSheet-only styling and token-driven sizing.

## Future Extension
- Replace mock hook data with ProfileService and GarageService API data.
- Add actionable "Add Vehicle" flow and edit/remove bike controls.
- Persist section selection across app sessions.
