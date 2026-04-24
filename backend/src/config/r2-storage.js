const { randomUUID } = require("crypto");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const publicBaseUrl =
	process.env.CLOUDFLARE_R2_PUBLIC_URL ||
	(accountId ? `https://pub-${accountId}.r2.dev` : null);

const isR2Configured =
	Boolean(accountId) &&
	Boolean(accessKeyId) &&
	Boolean(secretAccessKey) &&
	Boolean(bucket) &&
	Boolean(publicBaseUrl);

let s3Client = null;

const getClient = () => {
	if (!isR2Configured) {
		throw new Error(
			"Cloudflare R2 is not configured. Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY, CLOUDFLARE_R2_BUCKET_NAME, and CLOUDFLARE_R2_PUBLIC_URL.",
		);
	}

	if (s3Client) {
		return s3Client;
	}

	s3Client = new S3Client({
		region: "auto",
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	return s3Client;
};

const extensionFromMime = (mimeType) => {
	if (!mimeType || typeof mimeType !== "string") {
		return "bin";
	}

	const [, extension = "bin"] = mimeType.split("/");
	return extension.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
};

const normalizeFolder = (folder) =>
	String(folder || "general").replace(/^\/+|\/+$/g, "");

const sanitizeMetadata = (metadata) => {
	if (!metadata || typeof metadata !== "object") {
		return undefined;
	}

	const entries = Object.entries(metadata)
		.filter(([, value]) => value != null)
		.map(([key, value]) => [
			String(key)
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-"),
			String(value),
		]);

	if (entries.length === 0) {
		return undefined;
	}

	return Object.fromEntries(entries);
};

const resolveExpiresAt = (expiresAt, expiresInDays) => {
	if (expiresAt instanceof Date) {
		return expiresAt;
	}

	if (typeof expiresInDays === "number" && Number.isFinite(expiresInDays)) {
		const days = Math.max(0, expiresInDays);
		return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
	}

	return undefined;
};

const uploadBufferToR2 = async ({
	buffer,
	mimeType,
	folder = "general",
	metadata,
	expiresAt,
	expiresInDays,
}) => {
	const key = `${normalizeFolder(folder)}/${randomUUID()}.${extensionFromMime(mimeType)}`;
	const resolvedExpiresAt = resolveExpiresAt(expiresAt, expiresInDays);

	await getClient().send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: mimeType || "application/octet-stream",
			Expires: resolvedExpiresAt,
			Metadata: sanitizeMetadata(metadata),
		}),
	);

	return `${String(publicBaseUrl).replace(/\/+$/, "")}/${key}`;
};

module.exports = {
	isR2Configured,
	uploadBufferToR2,
};
