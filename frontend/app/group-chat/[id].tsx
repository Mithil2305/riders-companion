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
	INVITE_FRIENDS,
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

export default function GroupChatScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const roomId = typeof params.id === "string" ? params.id : "1";
	const roomStatus =
		typeof params.status === "string" ? params.status : undefined;
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
		rideMembers,
		organizerProfile,
		setDraft,
		setLocationEnabled,
		openMenu,
		closeMenu,
		closeInvite,
		inviteFromMenu,
		followRider,
		endRide,
		sendMessage,
	} = useGroupChatScreen(roomId, roomStatus);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: "#F4F4F4",
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
					backgroundColor: "#F7F7F7",
					borderTopLeftRadius: 18,
					borderTopRightRadius: 18,
					borderTopWidth: 1,
					borderTopColor: "#E7E7E7",
				},
				handleBar: {
					width: 54,
					height: 6,
					borderRadius: 999,
					backgroundColor: "#C6C6C6",
				},
				chatHalf: {
					flex: 1,
					backgroundColor: "#F7F7F7",
					borderTopWidth: 1,
					borderTopColor: "#EAEAEA",
				},
			}),
		[],
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
				onFollow={followRider}
				onOpenProfile={(riderId) => {
					setRideDetailsVisible(false);
					router.push(`/rider/${riderId}`);
				}}
				organizer={organizerProfile}
				riders={rideMembers.filter((member) => !member.isOrganizer)}
				visible={rideDetailsVisible}
			/>

			<InviteFriendsModal
				friends={INVITE_FRIENDS}
				onClose={closeInvite}
				visible={inviteVisible}
			/>
		</SafeAreaView>
	);
}
