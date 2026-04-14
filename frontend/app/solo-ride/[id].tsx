import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../../src/components/common";
import { useLocation } from "../../src/hooks/useLocation";
import { useTheme } from "../../src/hooks/useTheme";
import { useWebSocket } from "../../src/hooks/useWebSocket";

const toClockTime = (iso: string) => {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const hour = `${date.getHours()}`.padStart(2, "0");
	const minute = `${date.getMinutes()}`.padStart(2, "0");
	return `${hour}:${minute}`;
};

export default function SoloRideLiveScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { colors, metrics, typography } = useTheme();
	const rideId = typeof params.id === "string" ? params.id : "";

	const { location, getCurrentLocation, startWatching } = useLocation();
	const {
		isConnected,
		lastMessage,
		error,
		sendMessage: sendWsMessage,
	} = useWebSocket();

	const [status, setStatus] = React.useState("Connecting to live ride room...");
	const [lastEventTime, setLastEventTime] = React.useState("");
	const [liveRiderCount, setLiveRiderCount] = React.useState(1);

	React.useEffect(() => {
		if (!rideId || !isConnected) {
			return;
		}

		sendWsMessage("RIDE_JOIN", { rideId });
		sendWsMessage("RIDE_SNAPSHOT", { rideId });
		setStatus("Joined solo ride room. Sharing live location.");

		return () => {
			sendWsMessage("RIDE_LEAVE", { rideId });
		};
	}, [isConnected, rideId, sendWsMessage]);

	React.useEffect(() => {
		if (!rideId || !isConnected) {
			return;
		}

		let watcher: { remove: () => void } | null = null;
		void getCurrentLocation();

		startWatching()
			.then((subscription) => {
				watcher = subscription;
			})
			.catch(() => {
				setStatus("Location permission denied. Live tracking paused.");
			});

		return () => {
			watcher?.remove();
		};
	}, [getCurrentLocation, isConnected, rideId, startWatching]);

	React.useEffect(() => {
		if (!rideId || !location || !isConnected) {
			return;
		}

		sendWsMessage("LOCATION_UPDATE", {
			rideId,
			latitude: location.latitude,
			longitude: location.longitude,
			accuracy: location.accuracy,
		});
	}, [isConnected, location, rideId, sendWsMessage]);

	React.useEffect(() => {
		if (!lastMessage || typeof lastMessage.type !== "string") {
			return;
		}

		if (lastMessage.type === "RIDE_JOINED") {
			const payload = (lastMessage.payload || {}) as { locations?: unknown[] };
			const count = Array.isArray(payload.locations)
				? payload.locations.length
				: 1;
			setLiveRiderCount(Math.max(1, count));
			setStatus("Ride started. You are live on the map.");
			setLastEventTime(toClockTime(new Date().toISOString()));
			return;
		}

		if (lastMessage.type === "RIDE_SNAPSHOT") {
			const payload = (lastMessage.payload || {}) as { locations?: unknown[] };
			const count = Array.isArray(payload.locations)
				? payload.locations.length
				: 1;
			setLiveRiderCount(Math.max(1, count));
			setLastEventTime(toClockTime(new Date().toISOString()));
			return;
		}

		if (lastMessage.type === "LOCATION_UPDATE") {
			const payload = (lastMessage.payload || {}) as {
				rideId?: string;
				name?: string;
			};
			if (payload.rideId !== rideId) {
				return;
			}

			setStatus(`Live update received from ${payload.name || "rider"}.`);
			setLastEventTime(toClockTime(new Date().toISOString()));
			return;
		}

		if (lastMessage.type === "SOS_ALERT") {
			const payload = (lastMessage.payload || {}) as {
				rideId?: string;
				name?: string;
			};
			if (payload.rideId !== rideId) {
				return;
			}

			setStatus(`SOS alert from ${payload.name || "rider"}.`);
			setLastEventTime(toClockTime(new Date().toISOString()));
		}
	}, [lastMessage, rideId]);

	const sendSos = React.useCallback(() => {
		if (!rideId || !location) {
			return;
		}

		sendWsMessage("SOS_ALERT", {
			rideId,
			message: "SOS from solo rider",
			location: {
				latitude: location.latitude,
				longitude: location.longitude,
			},
		});
		setStatus("SOS sent to active ride participants.");
	}, [location, rideId, sendWsMessage]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				content: {
					padding: metrics.lg,
					gap: metrics.md,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				headerLeft: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				title: {
					fontSize: typography.sizes["2xl"],
					fontWeight: "700",
					color: colors.textPrimary,
				},
				subtitle: {
					fontSize: typography.sizes.sm,
					color: colors.textSecondary,
				},
				card: {
					padding: metrics.md,
					borderRadius: metrics.radius.xl,
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.surface,
					gap: metrics.sm,
				},
				label: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				value: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "600",
				},
				errorText: {
					color: colors.error,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
			}),
		[colors, metrics, typography],
	);

	return (
		<SafeAreaView edges={["left", "right"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				style={styles.container}
			>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Pressable hitSlop={8} onPress={() => router.back()}>
							<Ionicons
								color={colors.textPrimary}
								name="arrow-back"
								size={22}
							/>
						</Pressable>
						<Text style={styles.title}>Solo live tracking</Text>
					</View>
					<Text style={styles.subtitle}>
						{isConnected ? "LIVE" : "CONNECTING"}
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Ride ID</Text>
					<Text style={styles.value}>{rideId || "N/A"}</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Status</Text>
					<Text style={styles.value}>{status}</Text>
					<Text style={styles.label}>
						Live riders in room: {liveRiderCount}
					</Text>
					{lastEventTime ? (
						<Text style={styles.label}>Last event: {lastEventTime}</Text>
					) : null}
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Your location</Text>
					<Text style={styles.value}>
						{location
							? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
							: "Waiting for GPS..."}
					</Text>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}
				</View>

				<PrimaryButton onPress={sendSos} title="Send SOS" />
			</ScrollView>
		</SafeAreaView>
	);
}
