# Migration Guide: Live Ride Tracking

## What Changed

The `LiveRideTracker` component has been completely refactored to use **real dynamic data** instead of static values.

### Before (Static)
```tsx
<LiveRideTracker
  sourceLabel="Bangalore"
  destinationLabel="Mysore"
  destinationAvatar="https://..."
  stats={{
    speedKmh: 65,
    distanceKm: 45.2,
    distanceTotalKm: 140,
    elapsed: "1:34",
    remaining: "2:15",
    eta: "3:45 PM"
  }}
  onBack={() => { /* ... */ }}
  onEndRide={() => { /* ... */ }}
/>
```

### After (Real Data)
```tsx
<LiveRideTracker
  rideId="ride-abc123"
  onBack={() => { /* ... */ }}
  onEndRide={() => { /* ... */ }}
/>
```

That's it! Everything else is automatic.

---

## Integration Steps

### Step 1: Update Component Usage
Remove all props except `rideId`, `onBack`, and `onEndRide`.

### Step 2: Ensure RideContext Provider
Make sure your app is wrapped with `RideProvider`:

```tsx
// App.tsx or _layout.tsx
import { RideProvider } from '@/contexts/RideContext';

export default function RootLayout() {
  return (
    <RideProvider>
      {/* rest of app */}
    </RideProvider>
  );
}
```

### Step 3: Get the Ride ID
Pass the current ride ID from your route params or context:

```tsx
import { useRoute } from '@react-navigation/native';

export default function TrackingScreen() {
  const route = useRoute();
  const rideId = route.params?.rideId;

  return (
    <LiveRideTracker
      rideId={rideId}
      onBack={() => { /* ... */ }}
      onEndRide={() => { /* ... */ }}
    />
  );
}
```

---

## Data Flow

The component now:
1. **Fetches** ride snapshot (route, source/destination)
2. **Fetches** participant locations (real-time positions)
3. **Tracks** device location (user's current GPS)
4. **Uploads** location to backend (continuous)
5. **Calculates** navigation stats (speed, distance, ETA)
6. **Updates** every 3 seconds

All automatically. ✨

---

## Configuration

### Change Polling Interval
The component uses `useRideTracking` internally, which can be customized:

**In the component** (modify `liveRideTracking.tsx`):
```tsx
const {
  snapshot,
  navigationStats,
  locations,
  isLoading,
  error,
  refresh,
} = useRideTracking({
  rideId,
  enabled: true,
  pollIntervalMs: 5000,  // Change to 5 seconds instead of 3
});
```

### Manual Refresh
If you need to manually refresh:
```tsx
const { refresh } = useRideTracking({ rideId });

// Later...
await refresh();
```

---

## What's Automatic Now

✅ Route polyline (from backend, no more Google Directions API calls)
✅ Speed (from device GPS or reported by other riders)
✅ Distance traveled (calculated from polyline + position)
✅ Total distance (from route)
✅ Elapsed time (since ride start)
✅ Remaining time (calculated from speed)
✅ ETA (calculated dynamically)
✅ Participant locations (updated real-time)
✅ Progress bar (visual percentage)
✅ Error handling (with retry)
✅ Loading states (initial and refresh)
✅ Location upload to backend (continuous)

---

## Error Handling

If the component fails to load:

**UI Response:**
- Shows error icon + message
- Displays retry button
- Console logs detailed errors

**Your Code:**
```tsx
// Check for errors before rendering
const { error } = useRideTracking({ rideId });

if (error && !snapshot) {
  // Show fallback UI
}
```

---

## Performance Considerations

| Aspect | Details |
|--------|---------|
| **Update Frequency** | Every 3 seconds |
| **Location Uploads** | Every 1 second if location changes |
| **Data Size** | ~2KB per request |
| **Battery Impact** | Minimal (standard for navigation) |
| **Memory** | ~5-10MB for typical ride |

---

## Breaking Changes

❌ `sourceLabel` prop → Use `snapshot?.route.source`
❌ `destinationLabel` prop → Use `snapshot?.route.destination`
❌ `destinationAvatar` prop → Fetched from participant data
❌ `stats` prop → Calculated automatically via `navigationStats`
❌ Static data → All dynamic from backend

---

## Debugging

### Check if ride data is loading
```tsx
const { isLoading, snapshot } = useRideTracking({ rideId });

console.log('Loading:', isLoading);
console.log('Snapshot:', snapshot);
```

### Verify location uploads
Check backend logs or use another rider's view to see your position updates.

### Check calculations
```tsx
const { navigationStats } = useRideTracking({ rideId });

console.log('Speed:', navigationStats?.speedKmh);
console.log('Distance:', navigationStats?.distanceKm);
console.log('ETA:', navigationStats?.eta);
console.log('Progress:', navigationStats?.progress);
```

---

## Common Issues & Solutions

### Issue: Map shows but no data
**Solution:** Ensure `RideProvider` wraps your app and `rideId` is correct

### Issue: ETA shows "—"
**Solution:** Average speed is 0 (ride hasn't started moving yet)

### Issue: Distance not updating
**Solution:** Device location permission may be denied. Check logs.

### Issue: Participant markers don't appear
**Solution:** Other riders may not have started their location uploads yet

### Issue: Progress bar stuck at 0%
**Solution:** Route polyline may be empty or coordinates not found

---

## API Requirements

Your backend must have these endpoints (already implemented):

1. `GET /rides/{rideId}/snapshot` - Returns full ride snapshot
2. `GET /rides/{rideId}/locations` - Returns all participant locations
3. `POST /rides/{rideId}/location` - Accepts device location upload

See [MAP_ENHANCEMENTS.md](./MAP_ENHANCEMENTS.md) for details.

---

## Questions?

See [MAP_ENHANCEMENTS.md](./MAP_ENHANCEMENTS.md) for comprehensive documentation on:
- Architecture & data flow
- All available calculations
- Performance optimizations
- Testing checklist
