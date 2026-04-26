import React from "react";
import {
	Animated,
	KeyboardAvoidingView,
	PanResponder,
	Platform,
	StyleSheet,
	View,
	type LayoutChangeEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	useGroupChatScreen,
} from "../../src/hooks/useGroupChatScreen";
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

export default function GroupChatScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const roomId = typeof params.id === "string" ? params.id : "1";
	const roomStatus =
		typeof params.status === "string" ? params.status : undefined;
	const initialRoomName =
		typeof params.name === "string" ? params.name : undefined;
	const { colors } = useTheme();
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
		rideStatus,
		rideMembers,
		organizerProfile,
		setDraft,
		setLocationEnabled,
		openMenu,
		closeMenu,
		closeInvite,
		inviteFromMenu,
		sendRideInvite,
		toggleTrackRider,
		endRide,
		sendMessage,
	} = useGroupChatScreen(roomId, roomStatus, initialRoomName);

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
					paddingTop: 8,
					paddingBottom: 8,
					zIndex: 1,
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
			}),
		[colors],
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
					subtitle={roomSubtitle}
					title={roomTitle}
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
								riders={riderLocations}
								leaderRiderId={organizerProfile?.id}
								recenterSignal={recenterSignal}
								isRideEnded={isRideEnded}
								rideStarted={rideStatus === "STARTED"}
								sourceLabel={rideSourceLabel}
								destinationLabel={rideDestinationLabel}
							/>
						</View>

						<Animated.View style={[styles.chatSheet, { top: sheetTop }]}>
							<View style={styles.handleWrap} {...panResponder.panHandlers}>
								<View style={styles.handleBar} />
							</View>
							<View style={styles.chatHalf}>
								<GroupChatList data={messages} />
							</View>
							<GroupChatInputBar
								onChange={setDraft}
								onSend={sendMessage}
								value={draft}
							/>
						</Animated.View>
					</View>
				) : (
					<GroupChatList data={messages} />
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
				isAdmin={isAdmin}
				isRideEnded={isRideEnded}
				onClose={closeMenu}
				onRideDetails={() => {
					closeMenu();
					setRideDetailsVisible(true);
				}}
				onEndRide={endRide}
				onInvite={inviteFromMenu}
				visible={menuVisible}
			/>

			<GroupRideDetailsModal
				groupName={roomTitle}
				onClose={() => setRideDetailsVisible(false)}
				onToggleTrack={toggleTrackRider}
				onOpenProfile={(riderId) => {
					setRideDetailsVisible(false);
					router.push(`/rider/${riderId}`);
				}}
				organizer={organizerProfile}
				riders={rideMembers.filter((member) => !member.isOrganizer)}
				visible={rideDetailsVisible}
			/>

			<InviteFriendsModal
				friends={inviteFriends}
				onClose={closeInvite}
				onInvite={sendRideInvite}
				inviteStateByFriendId={inviteStateByFriendId}
				loading={inviteLoading}
				visible={inviteVisible}
				onSearch={searchInviteCandidates}
				searchResults={inviteSearchResults}
				isSearching={isInviteSearching}
			/>
		</SafeAreaView>
	);
}
