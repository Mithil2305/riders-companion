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
const COMPRESS_VIDEO_CRF = 30;

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

const compressVideoBuffer = async (buffer) => {
	if (!ffmpegPath) {
		throw new Error(
			"FFmpeg binary not available. Install ffmpeg-static to enable video compression.",
		);
	}

	const tempDir = os.tmpdir();
	const token = randomUUID();
	const inputPath = path.join(tempDir, `rider-upload-${token}.input.mp4`);
	const outputPath = path.join(tempDir, `rider-upload-${token}.output.mp4`);

	await fs.writeFile(inputPath, buffer);

	try {
		await new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.outputOptions([
					"-vcodec libx264",
					`-crf ${COMPRESS_VIDEO_CRF}`,
					"-preset veryfast",
					"-acodec aac",
					"-movflags +faststart",
				])
				.on("end", resolve)
				.on("error", reject)
				.save(outputPath);
		});

		return await fs.readFile(outputPath);
	} finally {
		await cleanupTmpFiles([inputPath, outputPath]);
	}
};

const compressMediaPayload = async ({ buffer, mimeType }) => {
	if (/^image\//i.test(mimeType || "")) {
		const compressedBuffer = await compressImageBuffer(buffer);
		return {
			buffer: compressedBuffer,
			mimeType: "image/jpeg",
		};
	}

	if (/^video\//i.test(mimeType || "")) {
		const compressedBuffer = await compressVideoBuffer(buffer);
		return {
			buffer: compressedBuffer,
			mimeType: "video/mp4",
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
		return { sourceKey: input.key, url };
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

		return { sourceKey: input.key, url };
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

	return { sourceKey: input.key, url };
}

function mediaUploadError(res, error, code = "MEDIA_UPLOAD_ERR") {
	return formatError(res, 400, error.message || "Media upload failed", code);
}

module.exports = {
	uploadMediaFromBody,
	mediaUploadError,
};
