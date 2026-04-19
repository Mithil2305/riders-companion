import React from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
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

export default function PostDetailsPage() {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{ postId?: string }>();
	const postId = typeof params.postId === "string" ? params.postId : "";

	const [loading, setLoading] = React.useState(true);
	const [deleting, setDeleting] = React.useState(false);
	const [post, setPost] = React.useState<FeedPostPayload | null>(null);
	const [myRiderId, setMyRiderId] = React.useState<string | null>(null);

	const isOwner = post?.rider?.id != null && post.rider.id === myRiderId;

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
				const [postData, profileData] = await Promise.all([
					FeedService.getPostById(postId),
					ProfileService.getMyProfile(),
				]);

				if (!mounted) {
					return;
				}

				setPost(postData.post);
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
		if (!post) {
			return;
		}

		router.push({
			pathname: "/create",
			params: {
				editPostId: post.id,
				editCaption: post.caption ?? "",
				editMediaUrl: post.mediaUrl ?? "",
				editMediaType: post.mediaType ?? "IMAGE",
			},
		});
	}, [post, router]);

	const onPressDelete = React.useCallback(() => {
		if (!post) {
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
						await FeedService.deletePost(post.id);
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
	}, [post, router]);

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
				card: {
					flex: 1,
				},
				postHeader: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.md,
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
					marginTop: "auto",
					marginHorizontal: metrics.md,
					marginBottom: metrics.lg,
					height: 48,
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

	if (!post || !post.mediaUrl) {
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
					<Text style={{ color: colors.textSecondary }}>Post not found.</Text>
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

			<View style={styles.card}>
				<View style={styles.postHeader}>
					<Image
						source={{ uri: post.rider?.profileImageUrl ?? FALLBACK_AVATAR }}
						style={styles.avatar}
					/>
					<View>
						<Text style={styles.username}>
							{post.rider?.username
								? `@${post.rider.username}`
								: (post.rider?.name ?? "rider")}
						</Text>
						<Text style={styles.time}>
							{formatRelativeTime(post.createdAt)}
						</Text>
					</View>
				</View>

				<View style={styles.mediaWrap}>
					{post.mediaType === "VIDEO" ? (
						<PostVideo uri={post.mediaUrl} />
					) : (
						<Image source={{ uri: post.mediaUrl }} style={styles.media} />
					)}

					{isOwner ? (
						<Pressable onPress={onPressEdit} style={styles.editIcon}>
							<Ionicons color="#fff" name="create-outline" size={18} />
						</Pressable>
					) : null}
				</View>

				<View style={styles.metaWrap}>
					<Text style={styles.likes}>{Number(post.likesCount ?? 0)} bumps</Text>
					<Text style={styles.caption}>
						<Text style={styles.captionUser}>
							{post.rider?.username
								? `@${post.rider.username}`
								: (post.rider?.name ?? "rider")}
						</Text>
						{post.caption ?? ""}
					</Text>
					<Text style={styles.comments}>
						View all {Number(post.commentsCount ?? 0)} comments
					</Text>
				</View>

				{isOwner ? (
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
		</SafeAreaView>
	);
}
