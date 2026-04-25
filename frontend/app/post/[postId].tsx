import React from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import FeedService, { FeedPostPayload } from "../../src/services/FeedService";
import ProfileService from "../../src/services/ProfileService";
import { useTheme } from "../../src/hooks/useTheme";

const FALLBACK_AVATAR =
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80";

const formatRelativeTime = (isoDate: string) => {
	const created = new Date(isoDate).getTime();
	if (Number.isNaN(created)) {
		return "now";
	}

	const diffMs = Date.now() - created;
	const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d ago`;
};

function isSameAuthor(candidate: FeedPostPayload, selected: FeedPostPayload) {
	if (candidate.id === selected.id) {
		return false;
	}

	if (candidate.rider?.id && selected.rider?.id) {
		return candidate.rider.id === selected.rider.id;
	}

	if (candidate.rider?.username && selected.rider?.username) {
		return candidate.rider.username === selected.rider.username;
	}

	return false;
}

function PostVideo({ uri }: { uri: string }) {
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = true;
		instance.play();
	});

	return (
		<VideoView
			contentFit="cover"
			nativeControls
			player={player}
			style={{ width: "100%", height: "100%" }}
		/>
	);
}

function PostCard({
	item,
	isSelected,
	showOwnerActions,
	deleting,
	onPressEdit,
	onPressDelete,
	onOpenProfile,
}: {
	item: FeedPostPayload;
	isSelected: boolean;
	showOwnerActions: boolean;
	deleting: boolean;
	onPressEdit: () => void;
	onPressDelete: () => void;
	onOpenProfile: () => void;
}) {
	const { colors, metrics, typography } = useTheme();

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.card,
				},
				selectedLabel: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
					color: colors.primary,
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 0.4,
				},
				postHeader: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
					paddingTop: isSelected ? metrics.xs : metrics.md,
					paddingBottom: metrics.sm,
				},
				avatar: {
					width: 34,
					height: 34,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.surface,
				},
				username: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				time: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
				},
				mediaWrap: {
					width: "100%",
					height: metrics.screenWidth * 0.9,
					backgroundColor: colors.surface,
					overflow: "hidden",
				},
				media: {
					width: "100%",
					height: "100%",
				},
				editIcon: {
					position: "absolute",
					top: metrics.sm,
					right: metrics.sm,
					width: 34,
					height: 34,
					borderRadius: 17,
					backgroundColor: "rgba(0,0,0,0.45)",
					alignItems: "center",
					justifyContent: "center",
				},
				metaWrap: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
					gap: metrics.xs,
				},
				likes: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				caption: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
					lineHeight: typography.sizes.sm * typography.lineHeights.normal,
				},
				captionUser: {
					color: colors.textPrimary,
					fontWeight: "700",
				},
				comments: {
					color: colors.textTertiary,
					fontSize: typography.sizes.sm,
				},
				deleteButton: {
					marginTop: metrics.sm,
					height: 44,
					borderRadius: metrics.radius.md,
					backgroundColor: "#c62828",
					alignItems: "center",
					justifyContent: "center",
				},
				deleteButtonText: {
					color: "#fff",
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
			}),
		[colors, isSelected, metrics, typography],
	);

	const authorLabel = item.rider?.username
		? `@${item.rider.username}`
		: (item.rider?.name ?? "rider");

	return (
		<View style={styles.card}>
			{isSelected ? <Text style={styles.selectedLabel}>Selected post</Text> : null}

			<View style={styles.postHeader}>
				<Pressable disabled={!item.rider?.id} onPress={onOpenProfile}>
					<Image
						source={{ uri: item.rider?.profileImageUrl ?? FALLBACK_AVATAR }}
						style={styles.avatar}
					/>
				</Pressable>
				<Pressable disabled={!item.rider?.id} onPress={onOpenProfile}>
					<Text style={styles.username}>{authorLabel}</Text>
					<Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
				</Pressable>
			</View>

			<View style={styles.mediaWrap}>
				{item.mediaType === "VIDEO" ? (
					<PostVideo uri={item.mediaUrl || ""} />
				) : (
					<Image source={{ uri: item.mediaUrl || "" }} style={styles.media} />
				)}

				{showOwnerActions ? (
					<Pressable onPress={onPressEdit} style={styles.editIcon}>
						<Ionicons color="#fff" name="create-outline" size={18} />
					</Pressable>
				) : null}
			</View>

			<View style={styles.metaWrap}>
				<Text style={styles.likes}>{Number(item.likesCount ?? 0)} bumps</Text>
				<Text style={styles.caption}>
					<Text style={styles.captionUser}>{authorLabel} </Text>
					{item.caption ?? ""}
				</Text>
				<Text style={styles.comments}>
					View all {Number(item.commentsCount ?? 0)} comments
				</Text>

				{showOwnerActions ? (
					<Pressable
						disabled={deleting}
						onPress={onPressDelete}
						style={styles.deleteButton}
					>
						<Text style={styles.deleteButtonText}>
							{deleting ? "Deleting..." : "Delete Post Permanently"}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

export default function PostDetailsPage() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{ postId?: string }>();
	const postId = typeof params.postId === "string" ? params.postId : "";

	const [loading, setLoading] = React.useState(true);
	const [deleting, setDeleting] = React.useState(false);
	const [posts, setPosts] = React.useState<FeedPostPayload[]>([]);
	const [myRiderId, setMyRiderId] = React.useState<string | null>(null);

	const selectedPost = posts[0] ?? null;
	const relatedPosts = posts.slice(1);
	const isOwner =
		selectedPost?.rider?.id != null && selectedPost.rider.id === myRiderId;

	React.useEffect(() => {
		let mounted = true;

		const load = async () => {
			if (!postId) {
				if (mounted) {
					setLoading(false);
				}
				return;
			}

			try {
				const [postData, profileData, feedData] = await Promise.all([
					FeedService.getPostById(postId),
					ProfileService.getMyProfile(),
					FeedService.getFeed(),
				]);

				if (!mounted) {
					return;
				}

				const primaryPost = postData.post;
				const sameAuthorPosts = feedData.posts.filter(
					(candidate) => Boolean(candidate.mediaUrl) && isSameAuthor(candidate, primaryPost),
				);

				setPosts([primaryPost, ...sameAuthorPosts]);
				setMyRiderId(profileData.profile.id);
			} catch (error) {
				if (!mounted) {
					return;
				}
				Alert.alert(
					"Unable to open post",
					error instanceof Error ? error.message : "Post could not be loaded.",
				);
				router.back();
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			mounted = false;
		};
	}, [postId, router]);

	const onPressEdit = React.useCallback(() => {
		if (!selectedPost) {
			return;
		}

		router.push({
			pathname: "/create",
			params: {
				editPostId: selectedPost.id,
				editCaption: selectedPost.caption ?? "",
				editMediaUrl: selectedPost.mediaUrl ?? "",
				editMediaType: selectedPost.mediaType ?? "IMAGE",
			},
		});
	}, [router, selectedPost]);

	const onPressDelete = React.useCallback(() => {
		if (!selectedPost) {
			return;
		}

		Alert.alert("Delete post", "Delete this post permanently?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setDeleting(true);
					try {
						await FeedService.deletePost(selectedPost.id);
						router.replace("/(tabs)/profile");
					} catch (error) {
						Alert.alert(
							"Delete failed",
							error instanceof Error
								? error.message
								: "Unable to delete this post right now.",
						);
					} finally {
						setDeleting(false);
					}
				},
			},
		]);
	}, [router, selectedPost]);

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					height: 56,
					paddingHorizontal: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				headerTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				spacer: {
					width: 24,
					height: 24,
				},
				loadingWrap: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				},
				scrollContent: {
					paddingBottom: metrics.xl,
				},
				divider: {
					height: 10,
					backgroundColor: colors.background,
				},
				relatedHeader: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.md,
					gap: metrics.xs,
				},
				relatedTitle: {
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				relatedSubtitle: {
					color: colors.textSecondary,
					fontSize: typography.sizes.sm,
				},
				notFoundText: {
					color: colors.textSecondary,
				},
			}),
		[colors, metrics, typography],
	);

	if (loading) {
		return (
			<SafeAreaView
				edges={["left", "right", "top", "bottom"]}
				style={styles.container}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
					</Pressable>
					<Text style={styles.headerTitle}>Post</Text>
					<View style={styles.spacer} />
				</View>
				<View style={styles.loadingWrap}>
					<ActivityIndicator color={colors.primary} size="small" />
				</View>
			</SafeAreaView>
		);
	}

	if (!selectedPost || !selectedPost.mediaUrl) {
		return (
			<SafeAreaView
				edges={["left", "right", "top", "bottom"]}
				style={styles.container}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
					</Pressable>
					<Text style={styles.headerTitle}>Post</Text>
					<View style={styles.spacer} />
				</View>
				<View style={styles.loadingWrap}>
					<Text style={styles.notFoundText}>Post not found.</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			edges={["left", "right", "top", "bottom"]}
			style={styles.container}
		>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()}>
					<Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
				</Pressable>
				<Text style={styles.headerTitle}>Post</Text>
				<View style={styles.spacer} />
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<PostCard
					deleting={deleting}
					isSelected
					item={selectedPost}
					onOpenProfile={() =>
						selectedPost.rider?.id && router.push(`/rider/${selectedPost.rider.id}`)
					}
					onPressDelete={onPressDelete}
					onPressEdit={onPressEdit}
					showOwnerActions={isOwner}
				/>

				{relatedPosts.length > 0 ? (
					<>
						<View style={styles.divider} />
						<View style={styles.relatedHeader}>
							<Text style={styles.relatedTitle}>
								More from{" "}
								{selectedPost.rider?.username
									? `@${selectedPost.rider.username}`
									: (selectedPost.rider?.name ?? "this rider")}
							</Text>
							<Text style={styles.relatedSubtitle}>
								Scroll to keep browsing posts from the same profile.
							</Text>
						</View>

						{relatedPosts.map((item) => (
							<React.Fragment key={item.id}>
								<PostCard
									deleting={false}
									isSelected={false}
									item={item}
									onOpenProfile={() =>
										item.rider?.id && router.push(`/rider/${item.rider.id}`)
									}
									onPressDelete={() => undefined}
									onPressEdit={() => undefined}
									showOwnerActions={false}
								/>
								<View style={styles.divider} />
							</React.Fragment>
						))}
					</>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}
