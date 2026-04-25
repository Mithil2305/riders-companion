import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { apiUploadRequest } from "./api";
import ClipService from "./ClipService";
import FeedService from "./FeedService";
import StoryService from "./StoryService";
import { GalleryMediaAsset, UploadType } from "../types/upload";

const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;
const IMAGE_COMPRESSION = 0.8;

const extractHashtags = (text: string) => {
	const matches = text.match(/#[A-Za-z0-9_]+/g) ?? [];
	return matches.map((entry) => entry.toLowerCase());
};

const readBlobAsDataUrl = async (blob: Blob) => {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Failed to convert media."));
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("Failed to read selected media."));
		};

		reader.readAsDataURL(blob);
	});
};

export const getClipSelectionError = (asset: GalleryMediaAsset | null) => {
	if (asset == null) {
		return "Select a video to upload a clip.";
	}

	if (asset.mediaType !== "video") {
		return "Clips require video. Select a video to continue.";
	}

	return null;
};

type UploadRequest = {
	path: "/feed" | "/clips" | "/stories";
	body: Record<string, unknown>;
};

export type QueuedUploadInput = {
	uploadType: UploadType;
	description: string;
	selectedAsset: GalleryMediaAsset;
};

const buildUploadRequest = async ({
	uploadType,
	description,
	selectedAsset,
}: QueuedUploadInput): Promise<UploadRequest> => {
	if (uploadType === "clip") {
		const clipSelectionError = getClipSelectionError(selectedAsset);
		if (clipSelectionError) {
			throw new Error(clipSelectionError);
		}
	}

	const response = await fetch(selectedAsset.uri);
	let blob = await response.blob();

	if (selectedAsset.mediaType === "photo") {
		const manipulated = await manipulateAsync(selectedAsset.uri, [], {
			compress: IMAGE_COMPRESSION,
			format: SaveFormat.JPEG,
		});
		const compressedResponse = await fetch(manipulated.uri);
		blob = await compressedResponse.blob();
	}

	if (
		selectedAsset.mediaType === "video" &&
		blob.size > MAX_VIDEO_UPLOAD_BYTES
	) {
		const maxMb = Math.floor(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024));
		throw new Error(
			`Selected video is too large. Choose a video under ${maxMb}MB.`,
		);
	}

	const mediaData = await readBlobAsDataUrl(blob);
	const mediaMimeType =
		blob.type && blob.type.length > 0
			? blob.type
			: selectedAsset.mediaType === "video"
				? "video/mp4"
				: "image/jpeg";
	const hashtags = extractHashtags(description);
	const caption = description.trim();

	if (uploadType === "post") {
		const body: Parameters<FeedService["createPost"]>[0] = {
			caption,
			mediaData,
			mediaMimeType,
			hashtags,
		};

		return {
			path: "/feed",
			body,
		};
	}

	if (uploadType === "clip") {
		const body: Parameters<ClipService["createClip"]>[0] = {
			caption,
			mediaData,
			videoData: mediaData,
			mediaMimeType,
			hashtags,
		};

		return {
			path: "/clips",
			body,
		};
	}

	const body: Parameters<StoryService["createStory"]>[0] = {
		caption,
		mediaData,
		mediaMimeType,
		hashtags,
	};

	return {
		path: "/stories",
		body,
	};
};

class UploadService {
	async uploadWithProgress(
		input: QueuedUploadInput,
		onUploadProgress?: (progress: number) => void,
	) {
		const request = await buildUploadRequest(input);

		return apiUploadRequest(request.path, {
			body: request.body,
			method: "POST",
			timeoutMs: 15 * 60 * 1000,
			onUploadProgress,
		});
	}
}

export default new UploadService();
