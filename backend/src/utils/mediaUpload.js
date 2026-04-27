const { formatError } = require("./errorFormatter");
const { isR2Configured, uploadBufferToR2 } = require("../config/r2-storage");
const sharp = require("sharp");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

const dataUriRegex = /^data:([^;,]+);base64,(.+)$/i;
const COMPRESS_IMAGE_QUALITY = 80;
const MB = 1024 * 1024;
const MAX_VIDEO_INPUT_BYTES = 500 * MB;
const MAX_VIDEO_OUTPUT_BYTES = 200 * MB;
const DEFAULT_VIDEO_COMPRESSION_ATTEMPTS = [
	{ crf: 30, maxWidth: 1280, audioBitrate: "128k" },
	{ crf: 34, maxWidth: 960, audioBitrate: "128k" },
	{ crf: 38, maxWidth: 720, audioBitrate: "112k" },
	{ crf: 42, maxWidth: 540, audioBitrate: "96k" },
];
const CLIP_VIDEO_COMPRESSION_ATTEMPTS = [
	{ crf: 34, maxWidth: 960, audioBitrate: "112k" },
	{ crf: 38, maxWidth: 720, audioBitrate: "96k" },
	{ crf: 42, maxWidth: 540, audioBitrate: "80k" },
	{ crf: 46, maxWidth: 480, audioBitrate: "64k" },
];

if (ffmpegPath) {
	ffmpeg.setFfmpegPath(ffmpegPath);
}

const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const sanitizeString = (value) =>
	typeof value === "string" ? value.trim() : "";

const resolveFolder = ({ options, mimeType, sourceKey, body }) => {
	if (typeof options.folder === "function") {
		return options.folder({ mimeType, sourceKey, body });
	}

	return options.folder;
};

const resolveUploadExtras = (options) => {
	const extras = {};

	if (typeof options.expiresInDays === "number") {
		extras.expiresInDays = options.expiresInDays;
	}

	if (options.expiresAt instanceof Date) {
		extras.expiresAt = options.expiresAt;
	}

	if (options.metadata && typeof options.metadata === "object") {
		extras.metadata = options.metadata;
	}

	return extras;
};

const firstPresent = (obj, keys) => {
	for (const key of keys) {
		const value = sanitizeString(obj[key]);
		if (value.length > 0) {
			return { key, value };
		}
	}

	return null;
};

const mimeFromDataUri = (value) => {
	const match = value.match(dataUriRegex);
	if (!match) {
		return null;
	}

	return {
		mimeType: match[1],
		base64: match[2],
	};
};

const decodeBase64 = (value) => Buffer.from(value, "base64");

const cleanupTmpFiles = async (paths = []) => {
	await Promise.all(
		paths.map(async (filePath) => {
			try {
				await fs.unlink(filePath);
			} catch {
				// Best-effort cleanup for temp files.
			}
		}),
	);
};

const compressImageBuffer = async (buffer) => {
	return sharp(buffer)
		.rotate()
		.jpeg({ quality: COMPRESS_IMAGE_QUALITY, mozjpeg: true })
		.toBuffer();
};

const runVideoCompression = async ({
	inputPath,
	outputPath,
	crf,
	maxWidth,
	audioBitrate = "128k",
}) => {
	const outputOptions = [
		"-vcodec libx264",
		`-crf ${crf}`,
		"-preset veryfast",
		"-acodec aac",
		`-b:a ${audioBitrate}`,
		"-movflags +faststart",
	];

	if (maxWidth) {
		outputOptions.push(
			`-vf scale='min(${maxWidth},iw)':-2:force_original_aspect_ratio=decrease`,
		);
	}

	await new Promise((resolve, reject) => {
		ffmpeg(inputPath)
			.outputOptions(outputOptions)
			.on("end", resolve)
			.on("error", reject)
			.save(outputPath);
	});
};

const generateVideoThumbnailBuffer = async (buffer) => {
	if (!ffmpegPath) {
		return null;
	}

	const tempDir = os.tmpdir();
	const token = randomUUID();
	const inputPath = path.join(tempDir, `rider-thumb-${token}.input.mp4`);
	const outputPath = path.join(tempDir, `rider-thumb-${token}.output.jpg`);

	await fs.writeFile(inputPath, buffer);

	try {
		await new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.seekInput(0.1)
				.frames(1)
				.outputOptions(["-q:v 2"])
				.on("end", resolve)
				.on("error", reject)
				.save(outputPath);
		});

		return await fs.readFile(outputPath);
	} finally {
		await cleanupTmpFiles([inputPath, outputPath]);
	}
};

const resolveVideoCompressionAttempts = (profile) =>
	profile === "clip-fast"
		? CLIP_VIDEO_COMPRESSION_ATTEMPTS
		: DEFAULT_VIDEO_COMPRESSION_ATTEMPTS;

const compressVideoBuffer = async (buffer, profile = "default") => {
	if (!ffmpegPath) {
		throw new Error(
			"FFmpeg binary not available. Install ffmpeg-static to enable video compression.",
		);
	}

	if (buffer.length > MAX_VIDEO_INPUT_BYTES) {
		throw new Error("Media upload video must be 500MB or smaller.");
	}

	const tempDir = os.tmpdir();
	const token = randomUUID();
	const inputPath = path.join(tempDir, `rider-upload-${token}.input.mp4`);
	const outputPaths = [];

	await fs.writeFile(inputPath, buffer);

	try {
		const attempts = resolveVideoCompressionAttempts(profile);

		let smallestBuffer = buffer;

		for (const [index, attempt] of attempts.entries()) {
			const outputPath = path.join(
				tempDir,
				`rider-upload-${token}.output-${index}.mp4`,
			);
			outputPaths.push(outputPath);
			await runVideoCompression({ inputPath, outputPath, ...attempt });
			const compressedBuffer = await fs.readFile(outputPath);

			if (compressedBuffer.length < smallestBuffer.length) {
				smallestBuffer = compressedBuffer;
			}

			if (compressedBuffer.length <= MAX_VIDEO_OUTPUT_BYTES) {
				return compressedBuffer;
			}
		}

		if (smallestBuffer.length <= MAX_VIDEO_OUTPUT_BYTES) {
			return smallestBuffer;
		}

		throw new Error(
			"Media upload video could not be compressed under 200MB. Choose a shorter video or a smaller source file.",
		);
	} finally {
		await cleanupTmpFiles([inputPath, ...outputPaths]);
	}
};

const compressMediaPayload = async ({
	buffer,
	mimeType,
	videoCompressionProfile = "default",
}) => {
	if (/^image\//i.test(mimeType || "")) {
		const compressedBuffer = await compressImageBuffer(buffer);
		return {
			buffer: compressedBuffer,
			mimeType: "image/jpeg",
		};
	}

	if (/^video\//i.test(mimeType || "")) {
		const compressedBuffer = await compressVideoBuffer(
			buffer,
			videoCompressionProfile,
		);
		const thumbnailBuffer = await generateVideoThumbnailBuffer(compressedBuffer).catch(
			() => null,
		);
		return {
			buffer: compressedBuffer,
			mimeType: "video/mp4",
			thumbnailBuffer,
			thumbnailMimeType: thumbnailBuffer ? "image/jpeg" : undefined,
		};
	}

	return { buffer, mimeType };
};

async function uploadMediaFromBody(body, options) {
	const input = firstPresent(body, options.inputKeys);
	if (!input) {
		return null;
	}

	if (!isR2Configured) {
		throw new Error("Cloudflare R2 is not configured");
	}

	const parsedDataUri = mimeFromDataUri(input.value);
	if (parsedDataUri) {
		const compressed = await compressMediaPayload({
			buffer: decodeBase64(parsedDataUri.base64),
			mimeType: parsedDataUri.mimeType,
			videoCompressionProfile: options.videoCompressionProfile,
		});
		const folder = resolveFolder({
			options,
			mimeType: compressed.mimeType,
			sourceKey: input.key,
			body,
		});

		const url = await uploadBufferToR2({
			buffer: compressed.buffer,
			mimeType: compressed.mimeType,
			folder,
			...resolveUploadExtras(options),
		});
		const thumbnailUrl = compressed.thumbnailBuffer
			? await uploadBufferToR2({
					buffer: compressed.thumbnailBuffer,
					mimeType: compressed.thumbnailMimeType,
					folder: `${folder}/thumbnails`,
					...resolveUploadExtras(options),
			  })
			: null;
		return { sourceKey: input.key, url, thumbnailUrl };
	}

	if (isHttpUrl(input.value)) {
		const response = await fetch(input.value);
		if (!response.ok) {
			throw new Error(`Unable to fetch media from URL (${input.value})`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const compressed = await compressMediaPayload({
			buffer: Buffer.from(arrayBuffer),
			mimeType:
				response.headers.get("content-type") || options.fallbackMimeType,
			videoCompressionProfile: options.videoCompressionProfile,
		});
		const folder = resolveFolder({
			options,
			mimeType: compressed.mimeType,
			sourceKey: input.key,
			body,
		});

		const url = await uploadBufferToR2({
			buffer: compressed.buffer,
			mimeType: compressed.mimeType,
			folder,
			...resolveUploadExtras(options),
		});

		const thumbnailUrl = compressed.thumbnailBuffer
			? await uploadBufferToR2({
					buffer: compressed.thumbnailBuffer,
					mimeType: compressed.thumbnailMimeType,
					folder: `${folder}/thumbnails`,
					...resolveUploadExtras(options),
			  })
			: null;

		return { sourceKey: input.key, url, thumbnailUrl };
	}

	const fallbackMimeType = sanitizeString(
		body[options.mimeTypeKey || "mimeType"],
	);
	if (fallbackMimeType.length === 0) {
		throw new Error(
			`Missing mime type for ${input.key}. Provide data URI, remote URL, or ${options.mimeTypeKey || "mimeType"}.`,
		);
	}

	const compressed = await compressMediaPayload({
		buffer: decodeBase64(input.value),
		mimeType: fallbackMimeType,
		videoCompressionProfile: options.videoCompressionProfile,
	});
	const folder = resolveFolder({
		options,
		mimeType: compressed.mimeType,
		sourceKey: input.key,
		body,
	});

	const url = await uploadBufferToR2({
		buffer: compressed.buffer,
		mimeType: compressed.mimeType,
		folder,
		...resolveUploadExtras(options),
	});

	const thumbnailUrl = compressed.thumbnailBuffer
		? await uploadBufferToR2({
				buffer: compressed.thumbnailBuffer,
				mimeType: compressed.thumbnailMimeType,
				folder: `${folder}/thumbnails`,
				...resolveUploadExtras(options),
		  })
		: null;

	return { sourceKey: input.key, url, thumbnailUrl };
}

function mediaUploadError(res, error, code = "MEDIA_UPLOAD_ERR") {
	return formatError(res, 400, error.message || "Media upload failed", code);
}

module.exports = {
	uploadMediaFromBody,
	mediaUploadError,
};
