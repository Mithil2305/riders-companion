const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const SALT_BYTES = 16;
const SCHEME_VERSION = 1;
const MAX_MESSAGE_LENGTH = 8000;

const asBase64 = (buffer) => buffer.toString("base64");

const fromBase64 = (value, fieldName) => {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`Missing or invalid ${fieldName}`);
	}

	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
		throw new Error(`Invalid base64 ${fieldName}`);
	}

	return Buffer.from(value, "base64");
};

const getAuthIdSecret = () => {
	const authId = process.env.CHAT_AUTH_ID || process.env.AUTH_ID;
	if (typeof authId !== "string" || authId.trim().length < 16) {
		throw new Error("Missing CHAT_AUTH_ID (or AUTH_ID) in environment");
	}

	return Buffer.from(authId.trim(), "utf8");
};

const normalizeContext = ({ roomId, senderId, receiverId }) => {
	if (typeof roomId !== "string" || roomId.trim().length === 0) {
		throw new Error("roomId is required for chat encryption");
	}

	if (typeof senderId !== "string" || senderId.trim().length === 0) {
		throw new Error("senderId is required for chat encryption");
	}

	if (receiverId != null && typeof receiverId !== "string") {
		throw new Error("receiverId must be a string when provided");
	}

	return {
		roomId: roomId.trim(),
		senderId: senderId.trim(),
		receiverId: receiverId ? receiverId.trim() : null,
	};
};

const buildAad = ({ roomId, senderId, receiverId }) =>
	Buffer.from(
		JSON.stringify({
			roomId,
			senderId,
			receiverId: receiverId || null,
			v: SCHEME_VERSION,
		}),
		"utf8",
	);

const deriveKey = ({ salt, roomId }) => {
	const secret = getAuthIdSecret();
	const info = Buffer.from(
		`riders-companion:chat:${roomId}:v${SCHEME_VERSION}`,
		"utf8",
	);

	return crypto.hkdfSync("sha256", secret, salt, info, KEY_BYTES);
};

exports.assertCryptoReady = () => {
	getAuthIdSecret();
	return true;
};

const parseEnvelope = ({ encryptedPayload, iv }) => {
	if (
		typeof encryptedPayload !== "string" ||
		encryptedPayload.trim().length === 0
	) {
		throw new Error("encryptedPayload is required");
	}

	if (typeof iv !== "string" || iv.trim().length === 0) {
		throw new Error("iv is required");
	}

	let parsed;
	try {
		parsed = JSON.parse(encryptedPayload);
	} catch (_error) {
		throw new Error("Invalid encryptedPayload envelope");
	}

	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid encryptedPayload envelope");
	}

	if (parsed.v !== SCHEME_VERSION || parsed.alg !== ALGORITHM) {
		throw new Error("Unsupported encryption scheme version");
	}

	const ivBuffer = fromBase64(iv, "iv");
	const salt = fromBase64(parsed.salt, "salt");
	const ciphertext = fromBase64(parsed.ct, "ciphertext");
	const tag = fromBase64(parsed.tag, "auth_tag");

	if (ivBuffer.length !== IV_BYTES) {
		throw new Error("Invalid iv length");
	}

	if (salt.length !== SALT_BYTES) {
		throw new Error("Invalid salt length");
	}

	if (tag.length !== 16) {
		throw new Error("Invalid auth tag length");
	}

	return {
		iv: ivBuffer,
		salt,
		ciphertext,
		tag,
	};
};

exports.encryptMessage = ({ plainText, roomId, senderId, receiverId }) => {
	if (typeof plainText !== "string") {
		throw new Error("plainText must be a string");
	}

	const normalizedText = plainText.trim();
	if (normalizedText.length === 0) {
		throw new Error("Message text cannot be empty");
	}

	if (normalizedText.length > MAX_MESSAGE_LENGTH) {
		throw new Error("Message exceeds max allowed length");
	}

	const context = normalizeContext({ roomId, senderId, receiverId });
	const iv = crypto.randomBytes(IV_BYTES);
	const salt = crypto.randomBytes(SALT_BYTES);
	const aad = buildAad(context);
	const key = deriveKey({ salt, roomId: context.roomId });

	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	cipher.setAAD(aad);

	const ciphertext = Buffer.concat([
		cipher.update(normalizedText, "utf8"),
		cipher.final(),
	]);

	const tag = cipher.getAuthTag();
	const envelope = {
		v: SCHEME_VERSION,
		alg: ALGORITHM,
		salt: asBase64(salt),
		ct: asBase64(ciphertext),
		tag: asBase64(tag),
	};

	return {
		encryptedPayload: JSON.stringify(envelope),
		iv: asBase64(iv),
	};
};

exports.decryptMessage = ({
	encryptedPayload,
	iv,
	roomId,
	senderId,
	receiverId,
}) => {
	const context = normalizeContext({ roomId, senderId, receiverId });
	const parsed = parseEnvelope({ encryptedPayload, iv });
	const aad = buildAad(context);
	const key = deriveKey({ salt: parsed.salt, roomId: context.roomId });

	const decipher = crypto.createDecipheriv(ALGORITHM, key, parsed.iv);
	decipher.setAAD(aad);
	decipher.setAuthTag(parsed.tag);

	const decrypted = Buffer.concat([
		decipher.update(parsed.ciphertext),
		decipher.final(),
	]);

	return decrypted.toString("utf8");
};
