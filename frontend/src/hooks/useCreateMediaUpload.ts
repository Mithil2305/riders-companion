import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import UploadService, {
	getClipSelectionError,
} from "../services/UploadService";
import {
	ComposerStep,
	GalleryAlbum,
	GalleryMediaAsset,
	UploadType,
} from "../types/upload";

const PAGE_SIZE = 60;
const RECENT_ALBUM_ID = "__recent__";
const toGalleryAsset = (asset: MediaLibrary.Asset): GalleryMediaAsset => ({
	id: asset.id,
	uri: asset.uri,
	mediaType:
		asset.mediaType === MediaLibrary.MediaType.video ? "video" : "photo",
	filename: asset.filename ?? undefined,
	duration:
		typeof asset.duration === "number" && Number.isFinite(asset.duration)
			? asset.duration
			: undefined,
	fileSize:
		typeof (asset as unknown as { fileSize?: number }).fileSize === "number"
			? (asset as unknown as { fileSize: number }).fileSize
			: undefined,
});

const toPickerAsset = (
	asset: ImagePicker.ImagePickerAsset,
): GalleryMediaAsset => ({
	id:
		(typeof asset.assetId === "string" && asset.assetId.length > 0
			? asset.assetId
			: asset.uri) ?? `${Date.now()}`,
	uri: asset.uri,
	mediaType: asset.type === "video" ? "video" : "photo",
	filename: asset.fileName ?? undefined,
	duration:
		typeof asset.duration === "number" && Number.isFinite(asset.duration)
			? asset.duration
			: undefined,
	fileSize:
		typeof asset.fileSize === "number" && Number.isFinite(asset.fileSize)
			? asset.fileSize
			: undefined,
});

export function useCreateMediaUpload() {
	const [step, setStep] = React.useState<ComposerStep>("picker");
	const [uploadType, setUploadType] = React.useState<UploadType>("post");
	const [description, setDescription] = React.useState("");
	const [permissionGranted, setPermissionGranted] = React.useState<
		boolean | null
	>(null);
	const [albums, setAlbums] = React.useState<GalleryAlbum[]>([]);
	const [selectedAlbumId, setSelectedAlbumId] =
		React.useState<string>(RECENT_ALBUM_ID);
	const [assets, setAssets] = React.useState<GalleryMediaAsset[]>([]);
	const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(
		null,
	);
	const [cursor, setCursor] = React.useState<string | undefined>(undefined);
	const [hasMoreAssets, setHasMoreAssets] = React.useState(false);
	const [isLoadingAssets, setIsLoadingAssets] = React.useState(false);
	const [isLoadingMore, setIsLoadingMore] = React.useState(false);
	const [isOpeningSystemPicker, setIsOpeningSystemPicker] =
		React.useState(false);
	const [isUploading, setIsUploading] = React.useState(false);

	const selectedAsset = React.useMemo(
		() => assets.find((item) => item.id === selectedAssetId) ?? null,
		[assets, selectedAssetId],
	);
	const clipSelectionError =
		uploadType === "clip" ? getClipSelectionError(selectedAsset) : null;
	const isClipSelectionInvalid = clipSelectionError != null;

	const requestPermission = React.useCallback(async () => {
		const permission = await MediaLibrary.requestPermissionsAsync();
		setPermissionGranted(permission.granted);
		return permission.granted;
	}, []);

	const loadAlbums = React.useCallback(async () => {
		const libraryAlbums = await MediaLibrary.getAlbumsAsync();
		const sortedAlbums = [...libraryAlbums].sort(
			(a, b) => (b.assetCount ?? 0) - (a.assetCount ?? 0),
		);

		const mapped: GalleryAlbum[] = [
			{
				id: RECENT_ALBUM_ID,
				title: "Recents",
				assetCount: 0,
			},
			...sortedAlbums.map((album) => ({
				id: album.id,
				title: album.title,
				assetCount: album.assetCount ?? 0,
			})),
		];

		setAlbums(mapped);
	}, []);

	const loadAssets = React.useCallback(
		async ({
			reset,
			afterCursor,
			albumId,
		}: {
			reset: boolean;
			afterCursor?: string;
			albumId?: string;
		}) => {
			if (reset) {
				setIsLoadingAssets(true);
			} else {
				setIsLoadingMore(true);
			}

			try {
				const targetAlbumId = albumId ?? selectedAlbumId;
				const response = await MediaLibrary.getAssetsAsync({
					first: PAGE_SIZE,
					after: reset ? undefined : afterCursor,
					album: targetAlbumId === RECENT_ALBUM_ID ? undefined : targetAlbumId,
					mediaType: [
						MediaLibrary.MediaType.photo,
						MediaLibrary.MediaType.video,
					],
					sortBy: [MediaLibrary.SortBy.creationTime],
				});

				const mapped = response.assets.map(toGalleryAsset);
				setAssets((prev) => {
					if (reset) {
						return mapped;
					}

					const knownIds = new Set(prev.map((entry) => entry.id));
					const nextItems = mapped.filter((entry) => !knownIds.has(entry.id));
					return [...prev, ...nextItems];
				});
				setCursor(response.endCursor ?? undefined);
				setHasMoreAssets(response.hasNextPage);
				if (reset && mapped.length > 0) {
					setSelectedAssetId(mapped[0].id);
				}
			} catch (error) {
				Alert.alert(
					"Gallery unavailable",
					error instanceof Error ? error.message : "Failed to load gallery.",
				);
			} finally {
				if (reset) {
					setIsLoadingAssets(false);
				} else {
					setIsLoadingMore(false);
				}
			}
		},
		[selectedAlbumId],
	);

	React.useEffect(() => {
		const init = async () => {
			const granted = await requestPermission();
			if (granted) {
				await loadAlbums();
				await loadAssets({ reset: true });
			}
		};

		void init();
	}, [loadAlbums, loadAssets, requestPermission]);

	const refreshAssets = React.useCallback(async () => {
		const granted = permissionGranted ?? (await requestPermission());
		if (!granted) {
			return;
		}

		await loadAlbums();
		await loadAssets({ reset: true });
	}, [loadAlbums, loadAssets, permissionGranted, requestPermission]);

	React.useEffect(() => {
		if (!permissionGranted) {
			return;
		}

		const subscription = MediaLibrary.addListener(() => {
			void refreshAssets();
		});

		return () => {
			subscription.remove();
		};
	}, [permissionGranted, refreshAssets]);

	const loadMoreAssets = React.useCallback(async () => {
		if (!hasMoreAssets || isLoadingMore || isLoadingAssets) {
			return;
		}

		await loadAssets({ reset: false, afterCursor: cursor });
	}, [cursor, hasMoreAssets, isLoadingAssets, isLoadingMore, loadAssets]);

	const openSystemPicker = React.useCallback(async () => {
		const granted = permissionGranted ?? (await requestPermission());
		if (!granted) {
			return;
		}

		setIsOpeningSystemPicker(true);
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes:
					uploadType === "clip"
						? ImagePicker.MediaTypeOptions.Videos
						: ImagePicker.MediaTypeOptions.All,
				allowsEditing: false,
				quality: 1,
				selectionLimit: 1,
			});

			if (result.canceled || result.assets.length === 0) {
				return;
			}

			const pickedAsset = toPickerAsset(result.assets[0]);

			setAssets((prev) => {
				const withoutSelected = prev.filter((entry) => entry.id !== pickedAsset.id);
				return [pickedAsset, ...withoutSelected];
			});
			setSelectedAssetId(pickedAsset.id);
			setSelectedAlbumId(RECENT_ALBUM_ID);
		} catch (error) {
			Alert.alert(
				"Gallery unavailable",
				error instanceof Error
					? error.message
					: "Failed to open your gallery app.",
			);
		} finally {
			setIsOpeningSystemPicker(false);
		}
	}, [permissionGranted, requestPermission, uploadType]);

	const selectAlbum = React.useCallback(
		async (albumId: string) => {
			if (albumId === selectedAlbumId) {
				return;
			}

			setSelectedAlbumId(albumId);
			setCursor(undefined);
			await loadAssets({ reset: true, albumId });
		},
		[loadAssets, selectedAlbumId],
	);

	const changeUploadType = React.useCallback(
		(nextType: UploadType) => {
			setUploadType(nextType);

			if (nextType !== "clip") {
				return;
			}

			if (getClipSelectionError(selectedAsset) == null) {
				return;
			}

			const firstVideo = assets.find((item) => item.mediaType === "video");
			if (firstVideo) {
				setSelectedAssetId(firstVideo.id);
				Alert.alert(
					"Clip requires a video",
					"Switched to a video. You can choose another one up to 500MB.",
				);
				return;
			}

			Alert.alert(
				"No supported videos found",
				"Select an album with videos up to 500MB.",
			);
		},
		[assets, selectedAsset],
	);

	const goNext = React.useCallback(() => {
		if (selectedAsset == null) {
			Alert.alert("Select media", "Choose a photo or video before continuing.");
			return;
		}

		if (uploadType === "clip" && clipSelectionError) {
			Alert.alert("Clip not supported", clipSelectionError);
			return;
		}

		setStep("details");
	}, [clipSelectionError, selectedAsset, uploadType]);

	const goBack = React.useCallback(() => {
		if (step === "details") {
			setStep("picker");
		}
	}, [step]);

	const upload = React.useCallback(async () => {
		if (selectedAsset == null) {
			throw new Error("Select media to upload.");
		}

		if (uploadType === "clip" && clipSelectionError) {
			throw new Error(clipSelectionError);
		}

		setIsUploading(true);
		try {
			await UploadService.uploadWithProgress({
				description,
				selectedAsset,
				uploadType,
			});
		} finally {
			setIsUploading(false);
		}
	}, [clipSelectionError, description, selectedAsset, uploadType]);

	return {
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
		isOpeningSystemPicker,
		isUploading,
		setDescription,
		changeUploadType,
		selectAlbum,
		setSelectedAssetId,
		goNext,
		goBack,
		refreshAssets,
		loadMoreAssets,
		openSystemPicker,
		upload,
	};
}
