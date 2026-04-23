import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
	ActivityIndicator,
	Animated,
	Alert,
	FlatList,
	Image,
	LayoutAnimation,
	PanResponder,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCreateMediaUpload } from "../src/hooks/useCreateMediaUpload";
import FeedService from "../src/services/FeedService";
import { useTheme } from "../src/hooks/useTheme";
import {
	AspectPreset,
	GalleryMediaAsset,
	UploadType,
} from "../src/types/upload";

const uploadTypeLabel: Record<UploadType, string> = {
	post: "Post",
	story: "Story",
	clip: "Clip",
};

const aspectPresets: AspectPreset[] = [
	"original",
	"1:1",
	"4:5",
	"16:9",
	"9:16",
];

const aspectLabel: Record<AspectPreset, string> = {
	original: "ORIGINAL",
	"1:1": "1:1",
	"4:5": "4:5",
	"16:9": "16:9",
	"9:16": "9:16",
};

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

const getAspectRatio = (preset: AspectPreset) => {
	if (preset === "1:1") {
		return 1;
	}

	if (preset === "4:5") {
		return 4 / 5;
	}

	if (preset === "16:9") {
		return 16 / 9;
	}

	if (preset === "9:16") {
		return 9 / 16;
	}

	return undefined;
};

function VideoPreview({
	uri,
	contentFit,
	style,
}: {
	uri: string;
	contentFit: "cover" | "contain";
	style: StyleProp<ViewStyle>;
}) {
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = true;
		instance.muted = true;
		instance.play();
	});

	return (
		<VideoView
			contentFit={contentFit}
			nativeControls={false}
			player={player}
			style={style}
		/>
	);
}

export default function CreateMediaScreen() {
	const { colors, metrics, typography } = useTheme();
	const params = useLocalSearchParams<{
		editPostId?: string;
		editCaption?: string;
		editMediaUrl?: string;
		editMediaType?: string;
	}>();
	const { height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const editPostId =
		typeof params.editPostId === "string" ? params.editPostId : "";
	const editCaption =
		typeof params.editCaption === "string" ? params.editCaption : "";
	const editMediaUrl =
		typeof params.editMediaUrl === "string" ? params.editMediaUrl : "";
	const editMediaType =
		typeof params.editMediaType === "string" ? params.editMediaType : "IMAGE";
	const isEditMode = editPostId.length > 0;
	const {
		step,
		uploadType,
		description,
		permissionGranted,
		albums,
		selectedAlbumId,
		assets,
		selectedAsset,
		isClipSelectionInvalid,
		clipSelectionError,
		isLoadingAssets,
		isLoadingMore,
		hasMoreAssets,
		isUploading,
		setDescription,
		changeUploadType,
		selectAlbum,
		setSelectedAssetId,
		goNext,
		goBack,
		refreshAssets,
		loadMoreAssets,
		upload,
	} = useCreateMediaUpload();
	const [aspectPreset, setAspectPreset] =
		React.useState<AspectPreset>("original");
	const [fitMode, setFitMode] = React.useState<"fill" | "fit">("fill");
	const mediaTransition = React.useRef(new Animated.Value(1)).current;

	React.useEffect(() => {
		if (isEditMode) {
			setDescription(editCaption);
		}
	}, [editCaption, isEditMode, setDescription]);

	React.useEffect(() => {
		if (uploadType === "story" && aspectPreset !== "9:16") {
			setAspectPreset("9:16");
			setFitMode("fill");
		}
	}, [aspectPreset, uploadType]);

	React.useEffect(() => {
		Animated.sequence([
			Animated.timing(mediaTransition, {
				toValue: 0.92,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.spring(mediaTransition, {
				toValue: 1,
				friction: 7,
				tension: 75,
				useNativeDriver: true,
			}),
		]).start();
	}, [aspectPreset, fitMode, mediaTransition, selectedAsset?.id, uploadType]);

	const previewMinHeight = 240;
	const previewMaxHeight = Math.max(
		previewMinHeight + 120,
		Math.floor(windowHeight * 0.62),
	);
	const previewMidHeight = Math.floor(
		(previewMinHeight + previewMaxHeight) / 2,
	);
	const previewHeight = React.useRef(
		new Animated.Value(previewMidHeight),
	).current;
	const previewHeightRef = React.useRef(previewMidHeight);
	const dragStartHeight = React.useRef(previewMidHeight);

	React.useEffect(() => {
		previewHeight.setValue(previewMidHeight);
		previewHeightRef.current = previewMidHeight;
	}, [previewHeight, previewMidHeight]);

	React.useEffect(() => {
		const id = previewHeight.addListener(({ value }) => {
			previewHeightRef.current = value;
		});

		return () => previewHeight.removeListener(id);
	}, [previewHeight]);

	const panResponder = React.useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_evt, gestureState) =>
					step === "picker" && Math.abs(gestureState.dy) > 8,
				onPanResponderGrant: () => {
					dragStartHeight.current = previewHeightRef.current;
				},
				onPanResponderMove: (_evt, gestureState) => {
					const nextHeight = clamp(
						dragStartHeight.current - gestureState.dy,
						previewMinHeight,
						previewMaxHeight,
					);
					previewHeight.setValue(nextHeight);
				},
				onPanResponderRelease: () => {
					const current = previewHeightRef.current;
					const snapPoints = [
						previewMinHeight,
						previewMidHeight,
						previewMaxHeight,
					];
					const target = snapPoints.reduce((closest, point) => {
						return Math.abs(point - current) < Math.abs(closest - current)
							? point
							: closest;
					}, snapPoints[0]);

					Animated.spring(previewHeight, {
						toValue: target,
						friction: 8,
						tension: 80,
						useNativeDriver: false,
					}).start();
				},
			}),
		[previewHeight, previewMaxHeight, previewMidHeight, previewMinHeight, step],
	);

	const activeAspectRatio = React.useMemo(
		() => getAspectRatio(aspectPreset),
		[aspectPreset],
	);
	const mediaContentFit = fitMode === "fill" ? "cover" : "contain";

	const styles = React.useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					height: 56,
					paddingHorizontal: metrics.md,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				headerTitle: {
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					color: colors.textPrimary,
				},
				headerAction: {
					fontSize: typography.sizes.base,
					fontWeight: "700",
					color: colors.primary,
				},
				albumRow: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					backgroundColor: colors.background,
				},
				albumChip: {
					paddingHorizontal: metrics.md,
					height: 34,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.border,
					marginRight: metrics.sm,
					flexDirection: "row",
					alignItems: "center",
					gap: 6,
				},
				albumChipActive: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				albumChipText: {
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					color: colors.textPrimary,
				},
				albumChipTextActive: {
					color: colors.textInverse,
				},
				albumCount: {
					fontSize: typography.sizes.xs,
					color: colors.textSecondary,
				},
				albumCountActive: {
					color: colors.textInverse,
				},
				previewWrap: {
					minHeight: 240,
					backgroundColor: colors.surface,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
				},
				dragHandleWrap: {
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 24,
					alignItems: "center",
					justifyContent: "center",
					zIndex: 3,
				},
				dragHandle: {
					width: 56,
					height: 4,
					borderRadius: metrics.radius.full,
					backgroundColor: "rgba(255,255,255,0.75)",
				},
				previewFrame: {
					width: "100%",
					height: "100%",
					backgroundColor: "#000000",
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
				},
				previewFrameAspect: {
					width: "100%",
					maxHeight: "100%",
				},
				previewMedia: {
					width: "100%",
					height: "100%",
				},
				emptyPreviewText: {
					fontSize: typography.sizes.base,
					color: colors.textSecondary,
				},
				grid: {
					paddingBottom: 120,
				},
				gridItem: {
					width: "33.3333%",
					aspectRatio: 1,
					padding: 1,
				},
				gridImage: {
					width: "100%",
					height: "100%",
				},
				selectedBorder: {
					...StyleSheet.absoluteFillObject,
					borderWidth: 3,
					borderColor: colors.primary,
				},
				videoBadge: {
					position: "absolute",
					top: 6,
					right: 6,
					backgroundColor: "rgba(0,0,0,0.45)",
					borderRadius: metrics.radius.full,
					paddingHorizontal: 8,
					paddingVertical: 2,
				},
				videoBadgeText: {
					color: "#ffffff",
					fontSize: typography.sizes.xs,
					fontWeight: "600",
				},
				cropToolbar: {
					paddingHorizontal: metrics.md,
					paddingVertical: metrics.sm,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					backgroundColor: colors.background,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				aspectRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: metrics.sm,
				},
				aspectChip: {
					paddingHorizontal: metrics.sm + 2,
					height: 30,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.border,
					alignItems: "center",
					justifyContent: "center",
				},
				aspectChipActive: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				aspectText: {
					fontSize: typography.sizes.xs,
					fontWeight: "700",
					color: colors.textPrimary,
				},
				aspectTextActive: {
					color: colors.textInverse,
				},
				fitToggle: {
					width: 36,
					height: 36,
					borderRadius: metrics.radius.full,
					borderWidth: 1,
					borderColor: colors.border,
					alignItems: "center",
					justifyContent: "center",
				},
				fitToggleActive: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				cropGrid: {
					...StyleSheet.absoluteFillObject,
					zIndex: 4,
				},
				cropGridVerticalOne: {
					position: "absolute",
					top: 0,
					bottom: 0,
					left: "33.33%",
					width: 1,
					backgroundColor: "rgba(255,255,255,0.45)",
				},
				cropGridVerticalTwo: {
					position: "absolute",
					top: 0,
					bottom: 0,
					left: "66.66%",
					width: 1,
					backgroundColor: "rgba(255,255,255,0.45)",
				},
				cropGridHorizontalOne: {
					position: "absolute",
					left: 0,
					right: 0,
					top: "33.33%",
					height: 1,
					backgroundColor: "rgba(255,255,255,0.45)",
				},
				cropGridHorizontalTwo: {
					position: "absolute",
					left: 0,
					right: 0,
					top: "66.66%",
					height: 1,
					backgroundColor: "rgba(255,255,255,0.45)",
				},
				clipWarning: {
					paddingHorizontal: metrics.md,
					paddingTop: metrics.sm,
					paddingBottom: metrics.xs,
					color: colors.warning,
					fontSize: typography.sizes.sm,
					fontWeight: "600",
				},
				bottomPickerFloating: {
					position: "absolute",
					left: metrics.md,
					right: metrics.md,
					bottom: Math.max(metrics.lg, insets.bottom + metrics.sm),
					backgroundColor: "#0f1217",
					borderRadius: metrics.radius.full,
					padding: 6,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				bottomPickerInline: {
					backgroundColor: "#0f1217",
					borderRadius: metrics.radius.full,
					padding: 6,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				bottomPickerItem: {
					flex: 1,
					paddingVertical: 10,
					borderRadius: metrics.radius.full,
					alignItems: "center",
				},
				bottomPickerItemActive: {
					backgroundColor: "#ffffff",
				},
				bottomPickerText: {
					fontSize: typography.sizes.base,
					fontWeight: "700",
					color: "rgba(255,255,255,0.58)",
					textTransform: "uppercase",
					letterSpacing: 1,
				},
				bottomPickerTextActive: {
					color: "#111318",
				},
				detailsWrap: {
					padding: metrics.md,
					gap: metrics.md,
					paddingBottom: metrics["3xl"],
				},
				detailsPreviewWrap: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: metrics.radius.lg,
					overflow: "hidden",
					backgroundColor: colors.surface,
				},
				label: {
					fontSize: typography.sizes.sm,
					fontWeight: "600",
					color: colors.textSecondary,
					marginBottom: 6,
				},
				input: {
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: metrics.radius.md,
					paddingHorizontal: metrics.md,
					paddingVertical: 12,
					fontSize: typography.sizes.base,
					color: colors.textPrimary,
					backgroundColor: colors.surface,
				},
				textarea: {
					minHeight: 124,
					textAlignVertical: "top",
				},
				hintText: {
					fontSize: typography.sizes.sm,
					color: colors.textSecondary,
				},
				uploadButton: {
					marginTop: metrics.sm,
					height: 50,
					borderRadius: metrics.radius.md,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.primary,
				},
				uploadButtonText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
				permissionState: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: metrics.xl,
					gap: metrics.sm,
				},
				permissionTitle: {
					fontSize: typography.sizes.lg,
					fontWeight: "700",
					color: colors.textPrimary,
				},
				permissionSubtitle: {
					fontSize: typography.sizes.base,
					color: colors.textSecondary,
					textAlign: "center",
				},
				retryButton: {
					marginTop: metrics.sm,
					paddingHorizontal: metrics.lg,
					height: 44,
					borderRadius: metrics.radius.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				retryButtonText: {
					color: colors.textInverse,
					fontSize: typography.sizes.base,
					fontWeight: "700",
				},
			}),
		[colors, insets.bottom, metrics, typography],
	);

	const renderSelectedPreview = React.useCallback(
		(containerStyle?: object) => {
			if (selectedAsset == null) {
				return (
					<Text style={styles.emptyPreviewText}>Select media from gallery</Text>
				);
			}

			const frameStyle = [
				styles.previewFrame,
				activeAspectRatio != null ? styles.previewFrameAspect : null,
				activeAspectRatio != null ? { aspectRatio: activeAspectRatio } : null,
				containerStyle,
			];

			if (selectedAsset.mediaType === "video") {
				return (
					<Animated.View
						style={[
							frameStyle,
							{
								opacity: mediaTransition,
								transform: [{ scale: mediaTransition }],
							},
						]}
					>
						<VideoPreview
							contentFit={mediaContentFit}
							style={styles.previewMedia}
							uri={selectedAsset.uri}
						/>
						{step === "picker" ? (
							<View pointerEvents="none" style={styles.cropGrid}>
								<View style={styles.cropGridVerticalOne} />
								<View style={styles.cropGridVerticalTwo} />
								<View style={styles.cropGridHorizontalOne} />
								<View style={styles.cropGridHorizontalTwo} />
							</View>
						) : null}
					</Animated.View>
				);
			}

			return (
				<Animated.View
					style={[
						frameStyle,
						{
							opacity: mediaTransition,
							transform: [{ scale: mediaTransition }],
						},
					]}
				>
					<Image
						source={{ uri: selectedAsset.uri }}
						style={styles.previewMedia}
						resizeMode={fitMode === "fill" ? "cover" : "contain"}
					/>
					{step === "picker" ? (
						<View pointerEvents="none" style={styles.cropGrid}>
							<View style={styles.cropGridVerticalOne} />
							<View style={styles.cropGridVerticalTwo} />
							<View style={styles.cropGridHorizontalOne} />
							<View style={styles.cropGridHorizontalTwo} />
						</View>
					) : null}
				</Animated.View>
			);
		},
		[
			activeAspectRatio,
			fitMode,
			mediaTransition,
			mediaContentFit,
			selectedAsset,
			step,
			styles.cropGrid,
			styles.cropGridHorizontalOne,
			styles.cropGridHorizontalTwo,
			styles.cropGridVerticalOne,
			styles.cropGridVerticalTwo,
			styles.emptyPreviewText,
			styles.previewFrame,
			styles.previewFrameAspect,
			styles.previewMedia,
		],
	);

	const renderGridItem = React.useCallback(
		({ item }: { item: GalleryMediaAsset }) => {
			const selected = selectedAsset?.id === item.id;
			return (
				<Pressable
					onPress={() => setSelectedAssetId(item.id)}
					style={styles.gridItem}
				>
					<Image source={{ uri: item.uri }} style={styles.gridImage} />
					{item.mediaType === "video" ? (
						<View style={styles.videoBadge}>
							<Text style={styles.videoBadgeText}>VIDEO</Text>
						</View>
					) : null}
					{selected ? <View style={styles.selectedBorder} /> : null}
				</Pressable>
			);
		},
		[selectedAsset?.id, setSelectedAssetId, styles],
	);

	const onUpload = React.useCallback(async () => {
		try {
			if (isEditMode) {
				await FeedService.updatePost(editPostId, {
					caption: description.trim(),
				});
				router.replace("/(tabs)/profile");
				return;
			}

			await upload();
			router.replace("/(tabs)/profile");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to upload media right now.";
			Alert.alert("Upload failed", message);
		}
	}, [description, editPostId, isEditMode, router, upload]);

	if (isEditMode) {
		return (
			<SafeAreaView
				edges={["top", "left", "right", "bottom"]}
				style={styles.root}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()}>
						<Ionicons color={colors.textPrimary} name="close" size={24} />
					</Pressable>
					<Text style={styles.headerTitle}>Details</Text>
					<Pressable disabled={isUploading} onPress={() => void onUpload()}>
						<Text style={styles.headerAction}>Save</Text>
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={styles.detailsWrap}>
					<View style={styles.detailsPreviewWrap}>
						<Animated.View
							style={[
								styles.previewFrame,
								styles.previewFrameAspect,
								{ aspectRatio: 1 },
							]}
						>
							{editMediaType === "VIDEO" ? (
								<VideoPreview
									contentFit={mediaContentFit}
									style={styles.previewMedia}
									uri={editMediaUrl}
								/>
							) : (
								<Image
									source={{ uri: editMediaUrl }}
									style={styles.previewMedia}
									resizeMode="cover"
								/>
							)}
						</Animated.View>
					</View>

					<View>
						<Text style={styles.label}>Caption</Text>
						<TextInput
							multiline
							onChangeText={setDescription}
							placeholder="Write a description..."
							placeholderTextColor={colors.textTertiary}
							style={[styles.input, styles.textarea]}
							value={description}
						/>
					</View>

					<Pressable
						disabled={isUploading}
						onPress={() => void onUpload()}
						style={styles.uploadButton}
					>
						{isUploading ? (
							<ActivityIndicator color={colors.textInverse} size="small" />
						) : (
							<Text style={styles.uploadButtonText}>Save Description</Text>
						)}
					</Pressable>
				</ScrollView>
			</SafeAreaView>
		);
	}

	if (permissionGranted === false) {
		return (
			<SafeAreaView style={styles.root}>
				<View style={styles.permissionState}>
					<Text style={styles.permissionTitle}>Gallery access needed</Text>
					<Text style={styles.permissionSubtitle}>
						Allow access to your photos and videos to create posts, stories, and
						clips.
					</Text>
					<Pressable
						onPress={() => void refreshAssets()}
						style={styles.retryButton}
					>
						<Text style={styles.retryButtonText}>Grant Access</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			edges={["top", "left", "right", "bottom"]}
			style={styles.root}
		>
			<View style={styles.header}>
				<Pressable
					onPress={() => {
						if (step === "details") {
							goBack();
							return;
						}
						router.back();
					}}
				>
					<Ionicons color={colors.textPrimary} name="close" size={24} />
				</Pressable>
				<Text style={styles.headerTitle}>
					{step === "picker" ? "New Create" : "Details"}
				</Text>
				{step === "picker" ? (
					<Pressable onPress={goNext}>
						<Text style={styles.headerAction}>Next</Text>
					</Pressable>
				) : (
					<Pressable disabled={isUploading} onPress={() => void onUpload()}>
						<Text style={styles.headerAction}>
							{isUploading ? "Uploading" : "Share"}
						</Text>
					</Pressable>
				)}
			</View>

			{step === "picker" && isClipSelectionInvalid ? (
				<Text style={styles.clipWarning}>
					{clipSelectionError ??
						"Clips require video. Select a video to continue."}
				</Text>
			) : null}

			{step === "picker" ? (
				<View style={styles.albumRow}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{albums.map((album) => {
							const active = album.id === selectedAlbumId;
							return (
								<Pressable
									key={album.id}
									onPress={() => void selectAlbum(album.id)}
									style={[
										styles.albumChip,
										active ? styles.albumChipActive : null,
									]}
								>
									<Text
										style={[
											styles.albumChipText,
											active ? styles.albumChipTextActive : null,
										]}
									>
										{album.title}
									</Text>
									{album.assetCount > 0 ? (
										<Text
											style={[
												styles.albumCount,
												active ? styles.albumCountActive : null,
											]}
										>
											{album.assetCount}
										</Text>
									) : null}
								</Pressable>
							);
						})}
					</ScrollView>
				</View>
			) : null}

			{step === "picker" ? (
				<>
					<Animated.View
						style={[styles.previewWrap, { height: previewHeight }]}
						{...panResponder.panHandlers}
					>
						<View style={styles.dragHandleWrap}>
							<View style={styles.dragHandle} />
						</View>
						{renderSelectedPreview()}
					</Animated.View>

					<View style={styles.cropToolbar}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View style={styles.aspectRow}>
								{aspectPresets
									.map((preset) => {
										const active = preset === aspectPreset;
										return (
											<Pressable
												key={preset}
												onPress={() => {
													if (uploadType === "story") {
														return;
													}
													LayoutAnimation.configureNext(
														LayoutAnimation.Presets.easeInEaseOut,
													);
													setAspectPreset(preset);
												}}
												style={[
													styles.aspectChip,
													active ? styles.aspectChipActive : null,
												]}
											>
												<Text
													style={[
														styles.aspectText,
														active ? styles.aspectTextActive : null,
													]}
												>
													{aspectLabel[preset]}
												</Text>
											</Pressable>
										);
									})
									.filter((item, index) => {
										if (uploadType !== "story") {
											return true;
										}
										return aspectPresets[index] === "9:16";
									})}
							</View>
						</ScrollView>

						<Pressable
							disabled={uploadType === "story"}
							onPress={() => {
								LayoutAnimation.configureNext(
									LayoutAnimation.Presets.easeInEaseOut,
								);
								setFitMode((prev) => (prev === "fill" ? "fit" : "fill"));
							}}
							style={[
								styles.fitToggle,
								uploadType === "story" ? { opacity: 0.45 } : null,
								fitMode === "fit" ? styles.fitToggleActive : null,
							]}
						>
							<Ionicons
								name={fitMode === "fill" ? "expand" : "contract"}
								size={18}
								color={
									fitMode === "fit" ? colors.textInverse : colors.textPrimary
								}
							/>
						</Pressable>
					</View>

					{isLoadingAssets ? (
						<View style={styles.permissionState}>
							<ActivityIndicator color={colors.primary} size="small" />
						</View>
					) : (
						<FlatList
							contentContainerStyle={styles.grid}
							data={assets}
							keyExtractor={(item) => item.id}
							numColumns={3}
							onEndReached={() => {
								if (hasMoreAssets) {
									void loadMoreAssets();
								}
							}}
							onEndReachedThreshold={0.45}
							renderItem={renderGridItem}
							ListFooterComponent={
								isLoadingMore ? (
									<View style={{ paddingVertical: 16 }}>
										<ActivityIndicator color={colors.primary} size="small" />
									</View>
								) : null
							}
						/>
					)}

					<View style={styles.bottomPickerFloating}>
						{(["post", "story", "clip"] as UploadType[]).map((type) => {
							const active = uploadType === type;
							return (
								<Pressable
									key={type}
									onPress={() => {
										LayoutAnimation.configureNext(
											LayoutAnimation.Presets.easeInEaseOut,
										);
										changeUploadType(type);
									}}
									style={[
										styles.bottomPickerItem,
										active ? styles.bottomPickerItemActive : null,
									]}
								>
									<Text
										style={[
											styles.bottomPickerText,
											active ? styles.bottomPickerTextActive : null,
										]}
									>
										{uploadTypeLabel[type]}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</>
			) : (
				<ScrollView contentContainerStyle={styles.detailsWrap}>
					<View style={styles.detailsPreviewWrap}>
						{renderSelectedPreview(styles.detailsPreviewWrap)}
					</View>

					<View>
						<Text style={styles.label}>Caption</Text>
						<TextInput
							multiline
							onChangeText={setDescription}
							placeholder="Write a description..."
							placeholderTextColor={colors.textTertiary}
							style={[styles.input, styles.textarea]}
							value={description}
						/>
					</View>

					<Pressable
						disabled={isUploading}
						onPress={() => void onUpload()}
						style={styles.uploadButton}
					>
						{isUploading ? (
							<ActivityIndicator color={colors.textInverse} size="small" />
						) : (
							<Text style={styles.uploadButtonText}>
								Upload {uploadTypeLabel[uploadType]}
							</Text>
						)}
					</Pressable>
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
