import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { withAlpha } from "../../utils/color";

type LatLng = { latitude: number; longitude: number };

interface NavigationStats {
  speedKmh?: number;
  distanceKm?: number;
  distanceTotalKm?: number;
  elapsed?: string;
  eta?: string;
  remaining?: string;
}

interface LiveRideTrackerProps {
  sourceLabel?: string;
  destinationLabel?: string;
  destinationAvatar?: string;
  stats?: NavigationStats;
  onBack?: () => void;
  onEndRide: () => void;
}

const DEFAULT_REGION = {
  latitude: 11.0017,
  longitude: 76.9619,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

async function geocodePlace(label: string, apiKey: string): Promise<LatLng | null> {
  if (!label || label.trim().length < 3) return null;
  try {
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      encodeURIComponent(label.trim()) +
      "&key=" +
      encodeURIComponent(apiKey);
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
    };
    if (data.status !== "OK" || !data.results?.length) return null;
    const loc = data.results[0]?.geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
    return { latitude: loc.lat, longitude: loc.lng };
  } catch {
    return null;
  }
}

async function fetchRoutePolyline(origin: LatLng, destination: LatLng, apiKey: string): Promise<LatLng[]> {
  try {
    const url =
      "https://maps.googleapis.com/maps/api/directions/json?" +
      "origin=" +
      origin.latitude +
      "," +
      origin.longitude +
      "&destination=" +
      destination.latitude +
      "," +
      destination.longitude +
      "&mode=driving" +
      "&key=" +
      encodeURIComponent(apiKey);
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      routes?: { overview_polyline?: { points?: string } }[];
    };
    if (data.status !== "OK" || !data.routes?.length) return [];
    const encoded = data.routes[0]?.overview_polyline?.points;
    if (!encoded) return [];
    return decodePolyline(encoded);
  } catch {
    return [];
  }
}

export default function LiveRideTracker({
  sourceLabel,
  destinationLabel,
  destinationAvatar,
  stats,
  onBack,
  onEndRide,
}: LiveRideTrackerProps) {
  const { colors, metrics, typography, resolvedMode } = useTheme();
  const mapRef = React.useRef<MapView>(null);
  const hasCenteredRef = React.useRef(false);
  const [routePoints, setRoutePoints] = React.useState<LatLng[]>([]);
  const [sourceCoord, setSourceCoord] = React.useState<LatLng | null>(null);
  const [destCoord, setDestCoord] = React.useState<LatLng | null>(null);
  const [userCoord, setUserCoord] = React.useState<LatLng | null>(null);

  React.useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    if (!apiKey) return;
    let cancelled = false;
    Promise.all([
      sourceLabel ? geocodePlace(sourceLabel, apiKey) : Promise.resolve(null),
      destinationLabel ? geocodePlace(destinationLabel, apiKey) : Promise.resolve(null),
    ]).then(([src, dst]) => {
      if (cancelled) return;
      setSourceCoord(src);
      setDestCoord(dst);
    });
    return () => {
      cancelled = true;
    };
  }, [sourceLabel, destinationLabel]);

  React.useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    if (!apiKey || !sourceCoord || !destCoord) {
      setRoutePoints([]);
      return;
    }
    let cancelled = false;
    fetchRoutePolyline(sourceCoord, destCoord, apiKey).then((points) => {
      if (cancelled) return;
      setRoutePoints(points);
    });
    return () => {
      cancelled = true;
    };
  }, [sourceCoord, destCoord]);

  const handleRecenter = React.useCallback(() => {
    if (!mapRef.current || !userCoord) return;
    mapRef.current.animateToRegion(
      {
        latitude: userCoord.latitude,
        longitude: userCoord.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );
  }, [userCoord]);

  React.useEffect(() => {
    if (!mapRef.current || !userCoord || hasCenteredRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userCoord.latitude,
        longitude: userCoord.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );
    hasCenteredRef.current = true;
  }, [userCoord]);

  const palette = React.useMemo(
    () => ({
      headerBg: withAlpha(colors.background, 0.95),
      panelBg: colors.surfaceRaised,
      panelShadow: colors.shadow,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      primary: colors.primary,
      iconBg: colors.primary,
      iconFg: colors.textInverse,
      dimOverlay:
        resolvedMode === "dark" ? withAlpha(colors.black, 0.28) : "transparent",
    }),
    [colors, resolvedMode],
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        map: {
          ...StyleSheet.absoluteFillObject,
        },
        mapDim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: palette.dimOverlay,
        },
        header: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          paddingHorizontal: metrics.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: palette.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.border, 0.5),
        },
        headerTitle: {
          color: palette.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: "600",
        },
        headerSpacer: {
          width: metrics.icon.md,
        },
        floatingNav: {
          position: "absolute",
          right: metrics.lg,
          top: "50%",
          transform: [{ translateY: -28 }],
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: palette.iconBg,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: palette.panelShadow,
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        },
        bottomPanel: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: metrics.lg,
          paddingTop: metrics.md,
          paddingBottom: metrics.lg,
          backgroundColor: palette.panelBg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: palette.panelShadow,
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
        },
        metricsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: metrics.md,
        },
        metricItem: {
          flex: 1,
          alignItems: "center",
        },
        metricValue: {
          color: palette.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: "700",
        },
        metricSub: {
          marginTop: 2,
          color: palette.textSecondary,
          fontSize: typography.sizes.xs,
          fontWeight: "600",
        },
        endRideButton: {
          height: 56,
          borderRadius: metrics.radius.lg,
          backgroundColor: palette.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: metrics.sm,
        },
        endRideText: {
          color: colors.textInverse,
          fontSize: typography.sizes.sm,
          fontWeight: "700",
        },
        markerWrap: {
          alignItems: "center",
        },
        markerGlow: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: withAlpha(colors.primary, 0.28),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
        },
        markerCore: {
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        markerAvatar: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.textInverse,
        },
      }),
    [colors, metrics, palette, typography],
  );

  const speedValue = stats?.speedKmh ?? 1;
  const distanceValue = stats?.distanceKm ?? 0.0;
  const distanceTotal = stats?.distanceTotalKm ?? 2.1;
  const elapsedValue = stats?.elapsed ?? "0:34";
  const remainingValue = stats?.remaining ?? "6 MIN";
  const etaValue = stats?.eta ?? "8:30 AM";

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        moveOnMarkerPress={false}
        onUserLocationChange={(event) => {
          const coords = event.nativeEvent.coordinate;
          if (coords) {
            setUserCoord({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }
        }}
      >
        {routePoints.length >= 2 && (
          <>
            <Polyline
              coordinates={routePoints}
              strokeColor={withAlpha(colors.primary, 0.28)}
              strokeWidth={9}
              lineJoin="round"
              lineCap="round"
            />
            <Polyline
              coordinates={routePoints}
              strokeColor={colors.primary}
              strokeWidth={6}
              lineJoin="round"
              lineCap="round"
            />
          </>
        )}
        {sourceCoord && (
          <Marker coordinate={sourceCoord} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.markerWrap}>
              <View style={styles.markerCore}>
                <Ionicons name="location" size={16} color={colors.textInverse} />
              </View>
            </View>
          </Marker>
        )}
        {destCoord && (
          <Marker coordinate={destCoord} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.markerWrap}>
              <View style={styles.markerGlow}>
                <View style={styles.markerCore}>
                  {destinationAvatar ? (
                    <Image source={{ uri: destinationAvatar }} style={styles.markerAvatar} />
                  ) : (
                    <Ionicons name="person" size={14} color={colors.textInverse} />
                  )}
                </View>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      <View pointerEvents="none" style={styles.mapDim} />

      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={metrics.icon.md} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Navigation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Pressable onPress={handleRecenter} style={styles.floatingNav}>
        <Ionicons name="navigate" size={22} color={palette.iconFg} />
      </Pressable>

      <View style={styles.bottomPanel}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{speedValue}</Text>
            <Text style={styles.metricSub}>KM/H</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{distanceValue.toFixed(1)}</Text>
            <Text style={styles.metricSub}>/ {distanceTotal.toFixed(1)} KM</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{elapsedValue}</Text>
            <Text style={styles.metricSub}>/ {remainingValue}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{etaValue}</Text>
            <Text style={styles.metricSub}>ETA</Text>
          </View>
        </View>
        <Pressable onPress={onEndRide} style={styles.endRideButton}>
          <Ionicons name="close" size={18} color={colors.textInverse} />
          <Text style={styles.endRideText}>End Ride</Text>
        </Pressable>
      </View>
    </View>
  );
}