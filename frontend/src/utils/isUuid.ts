const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export const isUuid = (value: unknown): value is string =>
	typeof value === "string" && UUID_REGEX.test(value);
