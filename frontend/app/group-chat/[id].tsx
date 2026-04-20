import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
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
	const { colors } = useTheme();
	const roomId = typeof params.id === "string" ? params.id : "1";
	const roomStatus =
		typeof params.status === "string" ? params.status : undefined;
	const [rideDetailsVisible, setRideDetailsVisible] = React.useState(false);
	const {
		menuVisible,
		inviteVisible,
		locationEnabled,
		isRideEnded,
		isAdmin,
		draft,
		messages,
		riderLocations,
		locationsLastUpdatedAt,
		locationsRefreshMinutes,
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
					backgroundColor: colors.chatSearchBg,
				},
				splitWrap: {
					flex: 1,
				},
				mapHalf: {
					flex: 1,
					paddingTop: 8,
				},
				chatHalf: {
					flex: 1,
				},
			}),
		[colors],
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
					/>
				) : null}

				{locationEnabled && !isRideEnded ? (
					<View style={styles.splitWrap}>
						<View style={styles.mapHalf}>
							<LiveMapSection
								lastUpdatedAt={locationsLastUpdatedAt}
								refreshIntervalMinutes={locationsRefreshMinutes}
								riders={riderLocations}
								leaderRiderId={organizerProfile?.id}
								isRideEnded={isRideEnded}
							/>
						</View>
						<View style={styles.chatHalf}>
							<GroupChatList data={messages} />
						</View>
					</View>
				) : (
					<GroupChatList data={messages} />
				)}

				{isRideEnded ? (
					<GroupChatClosedState />
				) : (
					<GroupChatInputBar
						onChange={setDraft}
						onSend={sendMessage}
						value={draft}
					/>
				)}
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
