import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageLike = {
	getItem: (key: string) => Promise<string | null>;
	setItem: (key: string, value: string) => Promise<void>;
	removeItem: (key: string) => Promise<void>;
};

const memoryStorage = new Map<string, string>();

const memoryFallback: StorageLike = {
	getItem: async (key: string) => memoryStorage.get(key) ?? null,
	setItem: async (key: string, value: string) => {
		memoryStorage.set(key, value);
	},
	removeItem: async (key: string) => {
		memoryStorage.delete(key);
	},
};

const getStorage = (): StorageLike => {
	try {
		if (
			AsyncStorage &&
			typeof AsyncStorage.getItem === "function" &&
			typeof AsyncStorage.setItem === "function" &&
			typeof AsyncStorage.removeItem === "function"
		) {
			return AsyncStorage as StorageLike;
		}
	} catch {
		// Fall through to memory fallback when native module is unavailable.
	}

	return memoryFallback;
};

const setupKey = (firebaseUid: string) => `profile_setup_done_${firebaseUid}`;

const skippedKey = (firebaseUid: string) =>
	`profile_setup_skipped_${firebaseUid}`;

const licenseKey = (firebaseUid: string) =>
	`profile_driver_license_${firebaseUid}`;

export async function isProfileSetupDone(
	firebaseUid: string,
): Promise<boolean> {
	const storage = getStorage();
	const value = await storage.getItem(setupKey(firebaseUid));
	return value === "1";
}

export async function markProfileSetupDone(
	firebaseUid: string,
	driverLicenseNumber: string,
): Promise<void> {
	const storage = getStorage();
	await storage.setItem(setupKey(firebaseUid), "1");
	await storage.removeItem(skippedKey(firebaseUid));
	await storage.setItem(licenseKey(firebaseUid), driverLicenseNumber);
}

export async function markProfileSetupSkipped(
	firebaseUid: string,
): Promise<void> {
	const storage = getStorage();
	await storage.setItem(skippedKey(firebaseUid), "1");
}

export async function isProfileSetupSkipped(
	firebaseUid: string,
): Promise<boolean> {
	const storage = getStorage();
	const value = await storage.getItem(skippedKey(firebaseUid));
	return value === "1";
}

export async function getStoredDriverLicense(
	firebaseUid: string,
): Promise<string | null> {
	const storage = getStorage();
	return storage.getItem(licenseKey(firebaseUid));
}
