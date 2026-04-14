const { formatError } = require("./errorFormatter");
const { isR2Configured, uploadBufferToR2 } = require("../config/r2-storage");

const dataUriRegex = /^data:([^;,]+);base64,(.+)$/i;

const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const sanitizeString = (value) =>
	typeof value === "string" ? value.trim() : "";

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
		const url = await uploadBufferToR2({
			buffer: decodeBase64(parsedDataUri.base64),
			mimeType: parsedDataUri.mimeType,
			folder: options.folder,
		});
		return { sourceKey: input.key, url };
	}

	if (isHttpUrl(input.value)) {
		const response = await fetch(input.value);
		if (!response.ok) {
			throw new Error(`Unable to fetch media from URL (${input.value})`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const url = await uploadBufferToR2({
			buffer: Buffer.from(arrayBuffer),
			mimeType:
				response.headers.get("content-type") || options.fallbackMimeType,
			folder: options.folder,
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

	const url = await uploadBufferToR2({
		buffer: decodeBase64(input.value),
		mimeType: fallbackMimeType,
		folder: options.folder,
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
