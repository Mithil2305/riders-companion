type MinimalAuthUser = {
	email?: string | null;
	profileSetupCompletedAt?: string | null;
};

export const ADMIN_ACCOUNT_EMAIL = "admin@rider.com";

export function isPrivilegedAccount(
	userOrEmail: MinimalAuthUser | string | null | undefined,
): boolean {
	const email =
		typeof userOrEmail === "string"
			? userOrEmail
			: (userOrEmail?.email ?? null);

	return (email ?? "").trim().toLowerCase() === ADMIN_ACCOUNT_EMAIL;
}

export function hasCompletedProfile(
	user: MinimalAuthUser | null | undefined,
): boolean {
	return Boolean(user?.profileSetupCompletedAt);
}
