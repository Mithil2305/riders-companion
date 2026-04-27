import React from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { InviteActionState, InviteFriendItem } from "../../../types/groupChat";
import { withAlpha } from "../../../utils/color";

interface InviteFriendsModalProps {
  visible: boolean;
  friends: InviteFriendItem[];
  onClose: () => void;
  onInvite: (friend: InviteFriendItem) => Promise<void>;
  inviteStateByFriendId?: Record<string, InviteActionState>;
  loading?: boolean;
  onSearch?: (query: string) => void;
  searchResults?: InviteFriendItem[];
  isSearching?: boolean;
}

export function InviteFriendsModal({
	visible,
	friends,
	onClose,
	onInvite,
	inviteStateByFriendId = {},
	loading = false,
	onSearch,
	searchResults = [],
	isSearching = false,
}: InviteFriendsModalProps) {
	const { colors, metrics, typography } = useTheme();
	const [searchQuery, setSearchQuery] = React.useState("");

	React.useEffect(() => {
		if (visible) {
			return;
		}

		setSearchQuery("");
		onSearch?.("");
	}, [visible, onSearch]);

	React.useEffect(() => {
		const timer = setTimeout(() => {
			onSearch?.(searchQuery);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchQuery, onSearch]);

	const normalizedQuery = searchQuery.trim().toLowerCase();
	const isGlobalSearchActive = normalizedQuery.length > 0 && Boolean(onSearch);
	const displayList = isGlobalSearchActive ? searchResults : friends.filter((friend) => {
		if (!normalizedQuery) {
			return true;
		}

		const searchSource = `${friend.name} ${friend.username ?? ""}`.toLowerCase();
		return searchSource.includes(normalizedQuery);
	});

  const styles = React.useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					backgroundColor: withAlpha(colors.shadow, 0.34),
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.lg,
				},
				card: {
					width: "100%",
					maxHeight: "78%",
					borderRadius: 22,
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
					padding: metrics.md,
					shadowColor: colors.shadow,
					shadowOpacity: 0.16,
					shadowOffset: { width: 0, height: 6 },
					shadowRadius: 12,
					elevation: 8,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.xl,
					fontWeight: "700",
					marginBottom: metrics.sm,
				},
				searchWrap: {
					flexDirection: "row",
					alignItems: "center",
					borderWidth: 1,
					borderColor: colors.border,
					backgroundColor: colors.background,
					borderRadius: metrics.radius.xl,
					paddingHorizontal: metrics.sm,
					marginBottom: metrics.sm,
				},
				searchInput: {
					flex: 1,
					height: 44,
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
				},
				listContent: {
					paddingBottom: metrics.sm,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingVertical: metrics.sm,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				rowLeft: {
					flex: 1,
					paddingRight: metrics.sm,
				},
				rowText: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
				},
				rowSubText: {
					marginTop: 2,
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					fontWeight: "500",
				},
				inviteBtn: {
					minWidth: 88,
					height: 36,
					borderRadius: 18,
					paddingHorizontal: metrics.md,
					backgroundColor: colors.primary,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: metrics.xs,
				},
				inviteBtnDisabled: {
					opacity: 0.65,
				},
				inviteText: {
					color: colors.textInverse,
					fontWeight: "600",
					fontSize: typography.sizes.sm,
				},
				emptyWrap: {
					paddingVertical: metrics.lg,
					alignItems: "center",
				},
				emptyText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					fontWeight: "500",
				},
				closeBtn: {
					marginTop: metrics.md,
					alignSelf: "flex-end",
					borderRadius: 20,
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					backgroundColor: colors.primary,
				},
				closeText: {
					color: colors.textInverse,
					fontWeight: "600",
					fontSize: typography.sizes.base,
				},
			}),
		[colors, metrics, typography],
	);

	const renderRow = React.useCallback(
		({ item }: { item: InviteFriendItem }) => {
			const inviteState = inviteStateByFriendId[item.id] ?? "idle";
			const inviteLabel =
				inviteState === "sent"
					? "Sent"
					: inviteState === "sending"
						? "Sending"
						: "Invite";
			const disabled = inviteState === "sending" || inviteState === "sent";

			return (
				<View style={styles.row}>
					<View style={styles.rowLeft}>
						<Text numberOfLines={1} style={styles.rowText}>
							{item.name}
						</Text>
						{item.username ? (
							<Text numberOfLines={1} style={styles.rowSubText}>
								@{item.username}
							</Text>
						) : null}
					</View>
					<Pressable
						disabled={disabled}
						onPress={() => {
							void onInvite(item);
						}}
						style={[styles.inviteBtn, disabled ? styles.inviteBtnDisabled : null]}
					>
						{inviteState === "sending" ? (
							<ActivityIndicator color={colors.textInverse} size="small" />
						) : (
							<Ionicons color={colors.textInverse} name="paper-plane" size={14} />
						)}
						<Text style={styles.inviteText}>{inviteLabel}</Text>
					</Pressable>
				</View>
			);
		},
		[colors.textInverse, inviteStateByFriendId, onInvite, styles],
	);

  return (
		<Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
			<Pressable onPress={onClose} style={styles.overlay}>
				<Pressable onPress={() => {}} style={styles.card}>
					<Text style={styles.title}>Invite Friends</Text>

					<View style={styles.searchWrap}>
						<Ionicons color={colors.textSecondary} name="search" size={18} />
						<TextInput
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={setSearchQuery}
							placeholder="Search friends"
							placeholderTextColor={colors.textTertiary}
							style={styles.searchInput}
							value={searchQuery}
						/>
					</View>

					{loading || isSearching ? (
						<View style={styles.emptyWrap}>
							<ActivityIndicator color={colors.primary} size="small" />
						</View>
					) : (
						<FlatList
							contentContainerStyle={styles.listContent}
							data={displayList}
							keyExtractor={(item) => item.id}
							renderItem={renderRow}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={
								<View style={styles.emptyWrap}>
									<Text style={styles.emptyText}>
										{isGlobalSearchActive ? "No users found" : "No friends found"}
									</Text>
								</View>
							}
						/>
					)}

					<Pressable onPress={onClose} style={styles.closeBtn}>
						<Text style={styles.closeText}>Close</Text>
					</Pressable>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
