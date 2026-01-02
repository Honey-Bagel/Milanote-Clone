import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a token with key versioning support
 * Format: "v1:iv:authTag:encryptedData"
 */
export async function encryptToken(token: string): Promise<string> {
	const version = process.env.INTEGRATION_ENCRYPTION_KEY_VERSION || 'v1';
	const key = process.env[`ENCRYPTION_KEY_${version.toUpperCase()}`] || process.env.ENCYPTION_KEY;

	if (!key) {
		throw new Error(`Encryption key for version ${version} not found`);
	}

	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);

	let encrypted = cipher.update(token, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag();

	// Prepend version for future key rotation support
	return `${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token (supports multiple key versions)
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
	const parts = encryptedToken.split(':');

	let version: string;
	let ivHex: string;
	let authTagHex: string;
	let encrypted: string;

	// Support both versioned and non-versioned formats
	if (parts.length === 4 && parts[0].startsWith('v')) {
		[version, ivHex, authTagHex, encrypted] = parts;
	} else {
		// Legacy format (no version prefix)
		version = 'v1';
		[ivHex, authTagHex, encrypted] = parts;
	}

	const key = process.env[`ENCRYPTION_KEY_${version.toUpperCase()}`] || process.env.ENCRYPTION_KEY;

	if (!key) {
		throw new Error(`Encryption key for version ${version} not found`);
	}

	const decipher = crypto.createDecipheriv(
		ALGORITHM,
		Buffer.from(key, 'hex'),
		Buffer.from(ivHex, 'hex')
	);

	decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
	
	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}