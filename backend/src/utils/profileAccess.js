const ADMIN_ACCOUNT_EMAIL = "admin@rider.com";

const normalizeEmail = (email) =>
	typeof email === "string" ? email.trim().toLowerCase() : "";

const isPrivilegedAccount = (user) =>
	normalizeEmail(user?.email) === ADMIN_ACCOUNT_EMAIL;

const hasCompletedProfile = (user) => Boolean(user?.profile_setup_completed_at);

const canCreateContentOrRide = (user) =>
	isPrivilegedAccount(user) || hasCompletedProfile(user);

module.exports = {
	ADMIN_ACCOUNT_EMAIL,
	isPrivilegedAccount,
	hasCompletedProfile,
	canCreateContentOrRide,
};
