/**
 * E2E Encryption utilities
 * Uses Expo Crypto for secure operations
 */

import * as Crypto from 'expo-crypto';

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<string> {
  const key = await Crypto.getRandomBytesAsync(32);
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a key pair for E2E encryption
 * Returns public and private keys
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  // TODO: Implement proper E2E key pair generation
  // For now, generating random keys as placeholders
  const publicKey = await generateKey();
  const privateKey = await generateKey();
  
  return { publicKey, privateKey };
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input
  );
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Encrypt a message (placeholder implementation)
 * TODO: Implement actual E2E encryption
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: string
): Promise<string> {
  // Placeholder: In production, use proper encryption library
  const encrypted = btoa(`${recipientPublicKey}:${message}`);
  return encrypted;
}

/**
 * Decrypt a message (placeholder implementation)
 * TODO: Implement actual E2E decryption
 */
export async function decryptMessage(
  encryptedMessage: string,
  privateKey: string
): Promise<string> {
  // Placeholder: In production, use proper decryption library
  try {
    const decoded = atob(encryptedMessage);
    const parts = decoded.split(':');
    return parts[1] || decoded;
  } catch {
    return encryptedMessage;
  }
}
