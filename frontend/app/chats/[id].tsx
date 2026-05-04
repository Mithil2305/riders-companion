import React from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	ChatHeader,
	ChatInput,
	MessageList,
	PersonalChatMenuSheet,
} from "../../src/components/chat";
import { useChat } from "../../src/hooks/useChat";
import { useTheme } from "../../src/hooks/useTheme";
import { isUuid } from "../../src/utils/isUuid";

export default function ChatRoomScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const params = useLocalSearchParams<{
		id?: string;
		name?: string;
		avatar?: string;
		username?: string;
	}>();
	const { id } = params;
	const isValidRoomId = isUuid(id);
	const roomId = isValidRoomId && typeof id === "string" ? id : "";
	const {
		meta,
		listData,
		draft,
		setDraft,
		sendMessage,
		sendImage,
		isLoading,
		isMenuVisible,
		openMenu,
		closeMenu,
		runMenuAction,
		respondToRideInvite,
		isBlocked,
		isBlockedByViewer,
	} = useChat(roomId);

	const onInviteAction = React.useCallback(
		async (messageId: string, action: "join" | "reject") => {
			const invite = await respondToRideInvite(messageId, action);
			if (!invite || action !== "join") {
				return;
			}

			router.push(`/group-chat/${invite.rideId}`);
		},
		[respondToRideInvite, router],
	);

	const displayMeta = React.useMemo(
		() => ({
			...meta,
			name:
				typeof params.name === "string" && params.name.trim().length > 0
					? params.name
					: typeof params.username === "string" &&
						  params.username.trim().length > 0
						? params.username
						: meta.name,
			username:
				typeof params.username === "string" && params.username.trim().length > 0
					? params.username
					: (meta.username ?? undefined),
			avatar:
				typeof params.avatar === "string" && params.avatar.trim().length > 0
					? params.avatar
					: (meta.avatar ??
						`https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || "Rider")}&background=212121&color=FFFFFF`),
			rideTogetherLabel:
				typeof params.username === "string" && params.username.trim().length > 0
					? `RIDER: @${params.username}`
					: meta.rideTogetherLabel,
		}),
		[meta, params.avatar, params.name, params.username],
	);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				errorWrap: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					padding: 24,
					backgroundColor: colors.background,
				},
				errorTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "600",
					marginBottom: 8,
				},
				errorBody: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					textAlign: "center",
					marginBottom: 16,
				},
				backButton: {
					paddingHorizontal: 18,
					paddingVertical: 10,
					borderRadius: 24,
					backgroundColor: colors.primary,
				},
				backButtonText: {
					color: colors.textInverse,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
			}),
		[colors, typography],
	);

	if (!isValidRoomId) {
		return (
			<SafeAreaView
				edges={["top", "left", "right", "bottom"]}
				style={styles.errorWrap}
			>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Text style={styles.backButtonText}>Back</Text>
				</Pressable>
				<Text style={styles.errorTitle}>Invalid chat link</Text>
				<Text style={styles.errorBody}>
					This conversation link is invalid or expired.
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			edges={["top", "left", "right", "bottom"]}
			style={styles.container}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
				style={styles.container}
			>
				<ChatHeader
					avatarUri={displayMeta.avatar}
					isOnline={displayMeta.isOnline}
					onBack={() => router.back()}
					onPressMenu={openMenu}
					rideLabel={displayMeta.rideTogetherLabel}
					showSpinner={isLoading}
					statusLabel={displayMeta.isOnline ? "Online" : "Offline"}
					title={displayMeta.name}
				/>
				<MessageList messages={listData} onInviteAction={onInviteAction} />
				<ChatInput
					disabled={isBlocked}
					onChangeText={setDraft}
					onSend={sendMessage}
					onSendImage={sendImage}
					value={draft}
				/>
			</KeyboardAvoidingView>

			<PersonalChatMenuSheet
				isBlocked={isBlockedByViewer}
				onClose={closeMenu}
				onSelectAction={runMenuAction}
				visible={isMenuVisible}
			/>
		</SafeAreaView>
	);
}
