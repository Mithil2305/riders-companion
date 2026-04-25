export type UploadType = "post" | "story" | "clip";

export type ComposerStep = "picker" | "details";

export interface GalleryMediaAsset {
	id: string;
	uri: string;
	mediaType: "photo" | "video";
	filename?: string;
	duration?: number;
	fileSize?: number;
}

export interface GalleryAlbum {
	id: string;
	title: string;
	assetCount: number;
}

export type AspectPreset = "original" | "1:1" | "4:5" | "16:9" | "9:16";
