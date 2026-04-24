import React, { useEffect, useState, useCallback } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from "react-native-reanimated";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import FeedService, { CommentPayload } from "../../services/FeedService";
import { useRouter } from "expo-router";

const formatRelativeTime = (isoDate: string) => {
	try {
		const dateObj = new Date(isoDate);
		if (isNaN(dateObj.getTime())) return "just now";
		const diffInSeconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
		if (diffInSeconds < 60) return "just now";
		const diffInMinutes = Math.floor(diffInSeconds / 60);
		if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}hr${diffInHours === 1 ? "" : "s"} ago`;
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}day${diffInDays === 1 ? "" : "s"} ago`;
		const diffInWeeks = Math.floor(diffInDays / 7);
		return `${diffInWeeks}wk ago`;
	} catch {
		return "just now";
	}
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CommentSheetProps {
	postId: string | null;
	visible: boolean;
	onClose: () => void;
	onCommentAdded?: (newCount: number) => void;
}

export function CommentSheet({
	postId,
	visible,
	onClose,
	onCommentAdded,
}: CommentSheetProps) {
	const { colors, metrics, typography } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const translateY = useSharedValue(SCREEN_HEIGHT);
	const opacity = useSharedValue(0);

	const [comments, setComments] = useState<CommentPayload[]>([]);
	const [loading, setLoading] = useState(false);
	const [inputText, setInputText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [timeTick, setTimeTick] = useState(0);

	const loadComments = useCallback(async () => {
		if (!postId) return;
		setLoading(true);
		try {
			const res = await FeedService.getComments(postId);
			setComments(res.comments ?? []);
		} catch {
			setComments([]);
		} finally {
			setLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		if (visible) {
			translateY.value = withSpring(0, { damping: 26, stiffness: 120 });
			opacity.value = withTiming(1, { duration: 250 });
			void loadComments();
			const timer = setInterval(() => setTimeTick((value) => value + 1), 60000);
			return () => clearInterval(timer);
		} else {
			translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
			opacity.value = withTiming(0, { duration: 200 });
			setTimeout(() => {
				setComments([]);
				setInputText("");
			}, 300);
		}
	}, [visible, loadComments, translateY, opacity]);

	const dismiss = useCallback(() => {
		translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
			runOnJS(onClose)();
		});
	}, [onClose, translateY]);

	const panGesture = Gesture.Pan()
		.onChange((event) => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd((event) => {
			if (event.translationY > SCREEN_HEIGHT * 0.25 || event.velocityY > 1000) {
				runOnJS(dismiss)();
			} else {
				translateY.value = withSpring(0, { damping: 26, stiffness: 120 });
			}
		});

	const animatedSheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const animatedBackdropStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const handleSend = async () => {
		if (!postId || !inputText.trim()) return;
		setIsSubmitting(true);
		try {
			const res = await FeedService.commentOnPost(postId, inputText.trim());
			setInputText("");
			if (res.comment) {
				setComments((prev) => [res.comment!, ...prev]);
			} else {
				void loadComments();
			}
			if (onCommentAdded) {
				onCommentAdded(res.commentsCount);
			}
		} catch {
			// Keep the draft available if sending fails.
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleLike = async (commentId: string, currentlyLiked: boolean) => {
		if (!postId) return;
		
		// Optimistic update
		setComments((prev) =>
			prev.map((c) => {
				if (c.id === commentId) {
					return {
						...c,
						likedByMe: !currentlyLiked,
						likesCount: currentlyLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1,
					};
				}
				return c;
			})
		);

		try {
			const response = currentlyLiked
				? await FeedService.unlikeComment(postId, commentId)
				: await FeedService.likeComment(postId, commentId);
			if (currentlyLiked) {
				setComments((prev) =>
					prev.map((c) =>
						c.id === commentId
							? { ...c, likedByMe: false, likesCount: response.likesCount }
							: c,
					),
				);
			} else {
				setComments((prev) =>
					prev.map((c) =>
						c.id === commentId
							? { ...c, likedByMe: true, likesCount: response.likesCount }
							: c,
					),
				);
			}
		} catch {
			// Revert on failure
			setComments((prev) =>
				prev.map((c) => {
					if (c.id === commentId) {
						return {
							...c,
							likedByMe: currentlyLiked,
							likesCount: currentlyLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1),
						};
					}
					return c;
				})
			);
		}
	};

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				modalView: {
					flex: 1,
					justifyContent: "flex-end",
				},
				backdrop: {
					...StyleSheet.absoluteFillObject,
					backgroundColor: "rgba(0,0,0,0.5)",
				},
				sheet: {
					height: SCREEN_HEIGHT * 0.85,
					backgroundColor: colors.background,
					borderTopLeftRadius: metrics.radius.xl,
					borderTopRightRadius: metrics.radius.xl,
					overflow: "hidden",
				},
				handleArea: {
					alignItems: "center",
					paddingVertical: metrics.sm,
				},
				handle: {
					width: 40,
					height: 5,
					borderRadius: 3,
					backgroundColor: colors.borderDark,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: metrics.md,
					paddingBottom: metrics.sm,
					borderBottomWidth: 1,
					borderBottomColor: colors.borderDark,
				},
				title: {
					color: colors.textPrimary,
					fontSize: typography.sizes.lg,
					fontWeight: "700",
				},
				closeTap: {
					padding: metrics.xs,
				},
				list: {
					flex: 1,
				},
				listContent: {
					padding: metrics.md,
					gap: metrics.lg,
					paddingBottom: insets.bottom + metrics.xl,
				},
				commentItem: {
					flexDirection: "row",
					gap: metrics.sm,
				},
				avatar: {
					width: 36,
					height: 36,
					borderRadius: 18,
					backgroundColor: colors.surface,
				},
				commentContent: {
					flex: 1,
				},
				commentAuthor: {
					color: colors.textPrimary,
					fontSize: typography.sizes.sm,
					fontWeight: "700",
				},
				commentText: {
					color: colors.textSecondary,
					fontSize: typography.sizes.base,
					lineHeight: 20,
					marginTop: 2,
				},
				commentTime: {
					color: colors.textTertiary,
					fontSize: typography.sizes.xs,
					marginTop: metrics.xs,
				},
				likeTap: {
					paddingLeft: metrics.xs,
					alignItems: "center",
					justifyContent: "flex-start",
					paddingTop: 4,
				},
				likeCount: {
					fontSize: typography.sizes.xs,
					color: colors.textSecondary,
					marginTop: 2,
				},
				inputArea: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: Platform.OS === "ios" ? insets.bottom + metrics.sm : metrics.md,
					borderTopWidth: 1,
					borderTopColor: colors.borderDark,
					backgroundColor: colors.background,
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				input: {
					flex: 1,
					minHeight: 40,
					maxHeight: 100,
					borderRadius: 20,
					backgroundColor: colors.surface,
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: metrics.sm,
					color: colors.textPrimary,
					fontSize: typography.sizes.base,
				},
				sendTap: {
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
			}),
		[colors, metrics, typography, insets.bottom],
	);

	return (
		<Modal visible={visible} transparent onRequestClose={dismiss} animationType="none">
			<GestureHandlerRootView style={styles.modalView}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={styles.modalView}
				>
					<Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
						<Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
					</Animated.View>

					<Animated.View style={[styles.sheet, animatedSheetStyle]}>
						<GestureDetector gesture={panGesture}>
							<View style={styles.handleArea}>
								<View style={styles.handle} />
							</View>
						</GestureDetector>

						<View style={styles.header}>
							<Text style={styles.title}>Comments</Text>
							<Pressable onPress={dismiss} style={styles.closeTap}>
								<Ionicons name="close" size={24} color={colors.textPrimary} />
							</Pressable>
						</View>

						{loading ? (
							<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<FlatList
								data={comments}
								keyExtractor={(item) => item.id}
								contentContainerStyle={styles.listContent}
								style={styles.list}
								renderItem={({ item }) => (
									<View style={styles.commentItem}>
										<Pressable disabled={!item.rider?.id} onPress={() => {
											if (!item.rider?.id) return;
											dismiss();
											router.push(`/rider/${item.rider.id}`);
										}}>
											<Image
												source={{ uri: item.rider?.profileImageUrl ?? "https://i.pravatar.cc/100" }}
												style={styles.avatar}
											/>
										</Pressable>
										<View style={styles.commentContent}>
											<Pressable disabled={!item.rider?.id} onPress={() => {
												if (!item.rider?.id) return;
												dismiss();
												router.push(`/rider/${item.rider.id}`);
											}}>
												<Text style={styles.commentAuthor}>
													{item.rider?.name ?? item.rider?.username ?? "Unknown"}
												</Text>
											</Pressable>
											<Text style={styles.commentText}>{item.commentText}</Text>
											<Text style={styles.commentTime}>
												{formatRelativeTime(item.createdAt)}
											</Text>
										</View>
										<Pressable style={styles.likeTap} onPress={() => toggleLike(item.id, !!item.likedByMe)}>
											<Ionicons 
												name={item.likedByMe ? "heart" : "heart-outline"} 
												size={16} 
												color={item.likedByMe ? colors.primary : colors.textTertiary} 
											/>
											<Text style={styles.likeCount}>{item.likesCount ?? 0}</Text>
										</Pressable>
									</View>
								)}
								extraData={timeTick}
								ListEmptyComponent={
									<Text style={{ textAlign: "center", color: colors.textTertiary }}>
										No comments yet. Be the first to comment!
									</Text>
								}
							/>
						)}

						<View style={styles.inputArea}>
							<TextInput
								style={styles.input}
								placeholder="Add a comment..."
								placeholderTextColor={colors.textTertiary}
								value={inputText}
								onChangeText={setInputText}
								multiline
								maxLength={500}
							/>
							<Pressable
								disabled={!inputText.trim() || isSubmitting}
								style={[styles.sendTap, { opacity: inputText.trim() && !isSubmitting ? 1 : 0.5 }]}
								onPress={handleSend}
							>
								{isSubmitting ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Ionicons name="arrow-up" size={20} color="#fff" />
								)}
							</Pressable>
						</View>
					</Animated.View>
				</KeyboardAvoidingView>
			</GestureHandlerRootView>
		</Modal>
	);
}
