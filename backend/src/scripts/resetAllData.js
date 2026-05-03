require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	S3Client,
} = require("@aws-sdk/client-s3");
const admin = require("../config/firebaseAdmin");
const { sequelize } = require("../models");

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;

const RESET_ALLOWED_FLAG = "--yes";

function ensureConfirmationFlag() {
	if (!process.argv.includes(RESET_ALLOWED_FLAG)) {
		throw new Error(
			[
				"This script is destructive.",
				`Run again with ${RESET_ALLOWED_FLAG} to continue.`,
				"Example: npm run db:reset-all -- --yes",
			].join(" "),
		);
	}
}

function isR2Configured() {
	return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY && R2_SECRET_KEY && R2_BUCKET);
}

function getR2Client() {
	if (!isR2Configured()) {
		return null;
	}

	return new S3Client({
		region: "auto",
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY,
			secretAccessKey: R2_SECRET_KEY,
		},
	});
}

async function clearR2BucketMedia() {
	const client = getR2Client();
	if (!client) {
		console.log("[media] R2 is not configured, skipping remote media cleanup.");
		return { deletedCount: 0, skipped: true };
	}

	let continuationToken;
	let totalDeleted = 0;

	do {
<<<<<<< HEAD
		const listResponse = await client.send(
			new ListObjectsV2Command({
				Bucket: R2_BUCKET,
				ContinuationToken: continuationToken,
				MaxKeys: 1000,
			}),
		);

		const keys = (listResponse.Contents || [])
			.map((item) => item.Key)
			.filter(Boolean);

		if (keys.length > 0) {
			await client.send(
				new DeleteObjectsCommand({
					Bucket: R2_BUCKET,
					Delete: {
						Objects: keys.map((key) => ({ Key: key })),
						Quiet: true,
					},
				}),
			);
			totalDeleted += keys.length;
=======
		// attempt a normal listing; if parsing fails (malformed XML), retry with
		// EncodingType=url which often avoids XML entity issues for strange keys
		let listResponse;
		let usedUrlEncoding = false;
		try {
			listResponse = await client.send(
				new ListObjectsV2Command({
					Bucket: R2_BUCKET,
					ContinuationToken: continuationToken,
					MaxKeys: 1000,
				}),
			);
		} catch (err) {
			console.warn(
				`[media] ListObjectsV2 failed, retrying with EncodingType=url: ${err && err.message}`,
			);
			listResponse = await client.send(
				new ListObjectsV2Command({
					Bucket: R2_BUCKET,
					ContinuationToken: continuationToken,
					MaxKeys: 1000,
					EncodingType: "url",
				}),
			);
			usedUrlEncoding = true;
		}

		const keys = (listResponse.Contents || [])
			.map((item) => item.Key)
			.filter(Boolean)
			.map((k) => (usedUrlEncoding ? decodeURIComponent(k) : k));

		if (keys.length > 0) {
			// DeleteObjects supports up to 1000 objects per request
			try {
				await client.send(
					new DeleteObjectsCommand({
						Bucket: R2_BUCKET,
						Delete: {
							Objects: keys.map((key) => ({ Key: key })),
							Quiet: true,
						},
					}),
				);
				totalDeleted += keys.length;
			} catch (delErr) {
				console.warn(
					`[media] Failed to delete some objects: ${delErr && delErr.message}`,
				);
			}
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
		}

		continuationToken = listResponse.IsTruncated
			? listResponse.NextContinuationToken
			: undefined;
	} while (continuationToken);

	console.log(
		`[media] Deleted ${totalDeleted} object(s) from R2 bucket ${R2_BUCKET}.`,
	);
	return { deletedCount: totalDeleted, skipped: false };
}

async function clearDirectoryContents(directoryPath) {
	try {
		const entries = await fs.readdir(directoryPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(directoryPath, entry.name);
			await fs.rm(fullPath, { recursive: true, force: true });
		}
		return true;
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

async function clearLocalMediaDirectories() {
	const backendRoot = path.resolve(__dirname, "../..");
	const candidates = [
		path.join(backendRoot, "uploads"),
		path.join(backendRoot, "media"),
		path.join(backendRoot, "storage"),
		path.join(backendRoot, "public", "uploads"),
		path.join(backendRoot, "public", "media"),
	];

	let cleared = 0;
	for (const candidate of candidates) {
		const didClear = await clearDirectoryContents(candidate);
		if (didClear) {
			cleared += 1;
			console.log(`[media] Cleared local folder: ${candidate}`);
		}
	}

	if (cleared === 0) {
		console.log("[media] No local media directories found to clear.");
	}

	return { directoriesCleared: cleared };
}

async function clearAllFirebaseUsers() {
	let nextPageToken;
	let totalDeleted = 0;

	do {
		const page = await admin.auth().listUsers(1000, nextPageToken);
		const uids = page.users.map((user) => user.uid);

		if (uids.length > 0) {
			const deleteResult = await admin.auth().deleteUsers(uids);
			totalDeleted += deleteResult.successCount;

			if (deleteResult.failureCount > 0) {
				console.warn(
					`[firebase] Failed to delete ${deleteResult.failureCount} user(s) in current batch.`,
				);
			}
		}

		nextPageToken = page.pageToken;
	} while (nextPageToken);

	console.log(`[firebase] Deleted ${totalDeleted} Firebase Auth user(s).`);
	return { deletedCount: totalDeleted };
}

async function truncateAllPublicTables() {
	const [rows] = await sequelize.query(`
		SELECT tablename
		FROM pg_tables
		WHERE schemaname = 'public'
	`);

	const tableNames = rows
		.map((row) => row.tablename)
		.filter((name) => typeof name === "string" && name.length > 0);

	if (tableNames.length === 0) {
		console.log("[database] No tables found in public schema.");
		return { truncatedTables: 0 };
	}

	const quotedTableNames = tableNames.map((name) => `"${name}"`).join(", ");
	await sequelize.query(
		`TRUNCATE TABLE ${quotedTableNames} RESTART IDENTITY CASCADE`,
	);

	console.log(`[database] Truncated ${tableNames.length} table(s).`);
	return { truncatedTables: tableNames.length };
}

async function run() {
	ensureConfirmationFlag();

	console.log(
		"Starting full reset: media + Firebase users + database tables...",
	);

<<<<<<< HEAD
	await clearR2BucketMedia();
	await clearLocalMediaDirectories();
=======
	// media deletion may fail due to odd object keys or remote issues; make it
	// non-fatal so the database truncation still happens.
	try {
		if (!process.argv.includes("--skip-media")) {
			await clearR2BucketMedia();
			await clearLocalMediaDirectories();
		} else {
			console.log("[media] Skipping media cleanup (--skip-media provided).");
		}
	} catch (err) {
		console.warn(`[media] Cleanup error (continuing): ${err && err.message}`);
	}

>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	await clearAllFirebaseUsers();
	await truncateAllPublicTables();

	await sequelize.close();
	console.log(
		"Reset complete. All tables are empty, media is cleared, and Firebase users are removed.",
	);
}

run()
	.then(() => process.exit(0))
	.catch(async (error) => {
		console.error("Reset failed:", error);
		try {
			await sequelize.close();
		} catch (closeError) {
			console.error("Failed to close database connection:", closeError);
		}
		process.exit(1);
	});
