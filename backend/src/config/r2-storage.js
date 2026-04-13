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

const uploadBufferToR2 = async ({ buffer, mimeType, folder = "general" }) => {
	const key = `${normalizeFolder(folder)}/${randomUUID()}.${extensionFromMime(mimeType)}`;

	await getClient().send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: mimeType || "application/octet-stream",
		}),
	);

	return `${String(publicBaseUrl).replace(/\/+$/, "")}/${key}`;
};

module.exports = {
	isR2Configured,
	uploadBufferToR2,
};
