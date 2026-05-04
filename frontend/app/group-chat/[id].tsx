import React, { Suspense } from "react";
import {
	ActivityIndicator,
	Animated,
	KeyboardAvoidingView,
	PanResponder,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
	type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGroupChatScreen } from "../../src/hooks/useGroupChatScreen";
import {
	GroupChatHeader,
	GroupChatInputBar,
	GroupChatList,
	GroupChatClosedState,
	GroupChatMenuSheet,
	GroupRideDetailsModal,
	InviteFriendsModal,
	LiveLocationBanner,
	LiveMapSection,
} from "../../src/components/chat/group";
import { useTheme } from "../../src/hooks/useTheme";
import { withAlpha } from "../../src/utils/color";
import { ChatErrorBoundary } from "../../src/components/ErrorBoundary";
import { isUuid } from "../../src/utils/isUuid";

// Safe wrapper for the actual screen content
function GroupChatScreenContent() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const roomId = typeof params.id === "string" ? params.id : "";
	const roomStatus =
		typeof params.status === "string" ? params.status : undefined;
	const initialRoomName =
		typeof params.name === "string" ? params.name : undefined;
	const { colors, typography } = useTheme();

	const isRoomIdValid = isUuid(roomId);

	// CRITICAL: All hooks must be called before any conditional returns
	const [rideDetailsVisible, setRideDetailsVisible] = React.useState(false);
	const [recenterSignal, setRecenterSignal] = React.useState(0);
	const [contentHeight, setContentHeight] = React.useState(0);
	const [sheetBounds, setSheetBounds] = React.useState({
		expandedTop: 90,
		collapsedTop: 360,
	});
	const sheetTop = React.useRef(new Animated.Value(360)).current;
	const dragStartTop = React.useRef(360);

	const {
		menuVisible,
		inviteVisible,
		locationEnabled,
		isRideEnded,
		isAdmin,
		draft,
		messages,
		riderLocations,
		roomTitle,
		roomSubtitle,
		inviteFriends,
		inviteLoading,
		inviteStateByFriendId,
		inviteSearchResults,
		isInviteSearching,
		searchInviteCandidates,
		rideSourceLabel,
		rideDestinationLabel,
		rideRoute,
		rideMembers,
		organizerProfile,
		inviteToast,
		isRideLive,
		setDraft,
		setLocationEnabled,
		openMenu,
		closeMenu,
		closeInvite,
		inviteFromMenu,
		sendRideInvite,
		toggleTrackRider,
		startRide,
		endRide,
		leaveRide,
		sendMessage,
		isLoading,
		isError,
		errorMessage,
	} = useGroupChatScreen(roomId, roomStatus, initialRoomName);

	// Defensive: Validate critical data before rendering
	const safeRoomTitle = roomTitle?.trim?.() || "Ride Chat";
	const safeRoomSubtitle = roomSubtitle?.trim?.() || "";
	const safeMessages = Array.isArray(messages) ? messages : [];
	const safeRiderLocations = Array.isArray(riderLocations)
		? riderLocations
		: [];
	const safeRideMembers = Array.isArray(rideMembers) ? rideMembers : [];
	const safeInviteFriends = Array.isArray(inviteFriends) ? inviteFriends : [];

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				splitWrap: {
					flex: 1,
					position: "relative",
				},
				mapHalf: {
					position: "relative",
					paddingTop: 8,
					paddingBottom: 8,
					zIndex: 1,
				},
				fullscreenButton: {
					position: "absolute",
					right: 20,
					top: 20,
					width: 40,
					height: 40,
					borderRadius: 20,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: withAlpha(colors.card, 0.92),
					borderWidth: 1,
					borderColor: colors.border,
					shadowColor: colors.shadow,
					shadowOpacity: 0.16,
					shadowRadius: 6,
					shadowOffset: { width: 0, height: 3 },
					elevation: 4,
				},
				chatSheet: {
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					top: 0,
					zIndex: 5,
				},
				handleWrap: {
					height: 26,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.card,
					borderTopLeftRadius: 18,
					borderTopRightRadius: 18,
					borderTopWidth: 1,
					borderTopColor: colors.border,
				},
				handleBar: {
					width: 54,
					height: 6,
					borderRadius: 999,
					backgroundColor: colors.neutralStrong,
				},
				chatHalf: {
					flex: 1,
					backgroundColor: colors.background,
					borderTopWidth: 1,
					borderTopColor: colors.border,
				},
				toastWrap: {
					position: "absolute",
					left: 24,
					right: 24,
					bottom: 28,
					borderRadius: 14,
					paddingVertical: 10,
					paddingHorizontal: 14,
					backgroundColor: withAlpha(colors.textPrimary, 0.9),
					shadowColor: colors.shadow,
					shadowOpacity: 0.2,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 6 },
					elevation: 6,
				},
				toastText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					textAlign: "center",
				},
			}),
		[colors, typography],
	);

	const onLayoutSplit = React.useCallback(
		(event: LayoutChangeEvent) => {
			const height = event.nativeEvent.layout.height;
			if (height <= 0 || height === contentHeight) {
				return;
			}

			const expandedTop = Math.max(80, Math.floor(height * 0.2));
			const collapsedTop = Math.max(
				expandedTop + 120,
				Math.floor(height * 0.58),
			);

			setContentHeight(height);
			setSheetBounds({ expandedTop, collapsedTop });
			sheetTop.setValue(collapsedTop);
			dragStartTop.current = collapsedTop;
		},
		[contentHeight, sheetTop],
	);

	const snapSheet = React.useCallback(
		(target: number) => {
			Animated.spring(sheetTop, {
				toValue: target,
				useNativeDriver: false,
				friction: 8,
				tension: 75,
			}).start();
			dragStartTop.current = target;
		},
		[sheetTop],
	);

	const panResponder = React.useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_evt, gestureState) =>
					Math.abs(gestureState.dy) > 6,
				onPanResponderGrant: () => {
					sheetTop.stopAnimation((value: number) => {
						dragStartTop.current = value;
					});
				},
				onPanResponderMove: (_evt, gestureState) => {
					const nextTop = Math.max(
						sheetBounds.expandedTop,
						Math.min(
							sheetBounds.collapsedTop,
							dragStartTop.current + gestureState.dy,
						),
					);
					sheetTop.setValue(nextTop);
				},
				onPanResponderRelease: (_evt, gestureState) => {
					const midpoint =
						(sheetBounds.expandedTop + sheetBounds.collapsedTop) / 2;
					const currentApprox = dragStartTop.current + gestureState.dy;
					if (gestureState.vy < -0.25 || currentApprox < midpoint) {
						snapSheet(sheetBounds.expandedTop);
						return;
					}
					snapSheet(sheetBounds.collapsedTop);
				},
			}),
		[sheetBounds.collapsedTop, sheetBounds.expandedTop, sheetTop, snapSheet],
	);

	// Render states: invalid room, loading, error, or main content
	if (!isRoomIdValid) {
		return <InvalidRoomState message="Invalid room ID. Please try again." />;
	}

	if (isLoading) {
		return <LoadingState message="Loading chat..." />;
	}

	if (isError) {
		return (
			<ErrorState
				message={errorMessage || "Failed to load chat"}
				onRetry={() => router.replace(`/group-chat/${roomId}`)}
			/>
		);
	}

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
				style={styles.container}
			>
				<GroupChatHeader
					onBack={() => router.back()}
					onOpenMenu={openMenu}
					rideStatus={isRideEnded ? "ended" : "active"}
					subtitle={safeRoomSubtitle}
					title={safeRoomTitle}
				/>

				{!isRideEnded ? (
					<LiveLocationBanner
						enabled={locationEnabled}
						onToggle={setLocationEnabled}
						onRecenter={() => setRecenterSignal((prev) => prev + 1)}
					/>
				) : null}

				{locationEnabled && !isRideEnded ? (
					<View onLayout={onLayoutSplit} style={styles.splitWrap}>
						<View style={styles.mapHalf}>
							<LiveMapSection
								riders={safeRiderLocations}
								leaderRiderId={organizerProfile?.id}
								recenterSignal={recenterSignal}
								isRideEnded={isRideEnded}
								rideStarted={isRideLive}
								route={rideRoute}
								sourceLabel={rideSourceLabel}
								destinationLabel={rideDestinationLabel}
							/>
							<Pressable
								hitSlop={10}
								onPress={() => {
									router.push({
										pathname: "/navigation",
										params: {
											rideId: roomId,
											canEndRide: isAdmin ? "true" : "false",
											sourceLabel: rideSourceLabel ?? "",
											destinationLabel: rideDestinationLabel ?? "",
										},
									});
								}}
								style={styles.fullscreenButton}
							>
								<Ionicons
									name="expand-outline"
									size={18}
									color={colors.textPrimary}
								/>
							</Pressable>
						</View>

						<Animated.View style={[styles.chatSheet, { top: sheetTop }]}>
							<View style={styles.handleWrap} {...panResponder.panHandlers}>
								<View style={styles.handleBar} />
							</View>
							<View style={styles.chatHalf}>
								<GroupChatList data={safeMessages} />
							</View>
							<GroupChatInputBar
								onChange={setDraft}
								onSend={sendMessage}
								value={draft}
							/>
						</Animated.View>
					</View>
				) : (
					<GroupChatList data={safeMessages} />
				)}

				{isRideEnded ? (
					<GroupChatClosedState />
				) : !locationEnabled ? (
					<GroupChatInputBar
						onChange={setDraft}
						onSend={sendMessage}
						value={draft}
					/>
				) : null}
			</KeyboardAvoidingView>

			<GroupChatMenuSheet
				canStartRide={isAdmin && !isRideEnded && !isRideLive}
				isAdmin={isAdmin}
				isRideEnded={isRideEnded}
				onClose={closeMenu}
				onStartRide={startRide}
				onRideDetails={() => {
					closeMenu();
					setRideDetailsVisible(true);
				}}
				onEndRide={endRide}
				onLeaveRide={async () => {
					closeMenu();
					const left = await leaveRide();
					if (left) {
						router.back();
					}
				}}
				onInvite={inviteFromMenu}
				visible={menuVisible}
			/>

			<GroupRideDetailsModal
				groupName={safeRoomTitle}
				onClose={() => setRideDetailsVisible(false)}
				onToggleTrack={toggleTrackRider}
				onOpenProfile={(riderId) => {
					setRideDetailsVisible(false);
					router.push(`/rider/${riderId}`);
				}}
				organizer={organizerProfile}
				riders={safeRideMembers.filter((member) => !member.isOrganizer)}
				visible={rideDetailsVisible}
			/>

			<InviteFriendsModal
				friends={safeInviteFriends}
				onClose={closeInvite}
				onInvite={sendRideInvite}
				inviteStateByFriendId={inviteStateByFriendId}
				loading={inviteLoading}
				visible={inviteVisible}
				onSearch={searchInviteCandidates}
				searchResults={inviteSearchResults}
				isSearching={isInviteSearching}
			/>

			{inviteToast ? (
				<View pointerEvents="none" style={styles.toastWrap}>
					<Text style={styles.toastText}>{inviteToast}</Text>
				</View>
			) : null}
		</SafeAreaView>
	);
}

// Loading state component
function LoadingState({ message }: { message: string }) {
	const { colors, typography } = useTheme();
	return (
		<SafeAreaView
			style={[styles.centerContainer, { backgroundColor: colors.background }]}
		>
			<ActivityIndicator size="large" color={colors.primary} />
			<Text
				style={[
					styles.messageText,
					{
						color: colors.textSecondary,
						fontSize: typography.sizes.base,
						marginTop: 16,
					},
				]}
			>
				{message}
			</Text>
		</SafeAreaView>
	);
}

// Error state component
function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	const { colors, typography } = useTheme();
	const router = useRouter();
	return (
		<SafeAreaView
			style={[styles.centerContainer, { backgroundColor: colors.background }]}
		>
			<Ionicons
				name="alert-circle-outline"
				size={64}
				color={colors.error || "#EF4444"}
			/>
			<Text
				style={[
					styles.messageText,
					{
						color: colors.textPrimary,
						fontSize: typography.sizes.lg,
						marginTop: 16,
						fontWeight: "600",
					},
				]}
			>
				Something went wrong
			</Text>
			<Text
				style={[
					styles.messageText,
					{
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						marginTop: 8,
						textAlign: "center",
						paddingHorizontal: 32,
					},
				]}
			>
				{message}
			</Text>
			<Pressable
				onPress={onRetry}
				style={[
					styles.retryButton,
					{ backgroundColor: colors.primary, marginTop: 24 },
				]}
			>
				<Text
					style={[
						styles.retryText,
						{
							color: colors.textInverse,
							fontSize: typography.sizes.base,
							fontWeight: "600",
						},
					]}
				>
					Try Again
				</Text>
			</Pressable>
			<Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
				<Text
					style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}
				>
					Go Back
				</Text>
			</Pressable>
		</SafeAreaView>
	);
}

// Invalid room state
function InvalidRoomState({ message }: { message: string }) {
	const { colors, typography } = useTheme();
	const router = useRouter();
	return (
		<SafeAreaView
			style={[styles.centerContainer, { backgroundColor: colors.background }]}
		>
			<Ionicons
				name="chatbubble-ellipses-outline"
				size={64}
				color={colors.textTertiary}
			/>
			<Text
				style={[
					styles.messageText,
					{
						color: colors.textPrimary,
						fontSize: typography.sizes.lg,
						marginTop: 16,
						fontWeight: "600",
					},
				]}
			>
				Chat Not Available
			</Text>
			<Text
				style={[
					styles.messageText,
					{
						color: colors.textSecondary,
						fontSize: typography.sizes.sm,
						marginTop: 8,
						textAlign: "center",
						paddingHorizontal: 32,
					},
				]}
			>
				{message}
			</Text>
			<Pressable
				onPress={() => router.back()}
				style={[
					styles.retryButton,
					{ backgroundColor: colors.primary, marginTop: 24 },
				]}
			>
				<Text
					style={[
						styles.retryText,
						{
							color: colors.textInverse,
							fontSize: typography.sizes.base,
							fontWeight: "600",
						},
					]}
				>
					Go Back
				</Text>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	centerContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	messageText: {
		textAlign: "center",
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 24,
	},
	retryText: {
		textAlign: "center",
	},
});

// Main export with error boundary
export default function GroupChatScreen() {
	return (
		<ChatErrorBoundary>
			<Suspense fallback={<LoadingState message="Loading..." />}>
				<GroupChatScreenContent />
			</Suspense>
		</ChatErrorBoundary>
	);
}
