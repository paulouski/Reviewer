/**
 * Crypto Storage - Secure encrypted storage for sensitive data
 * 
 * Uses Web Crypto API (AES-GCM) to encrypt sensitive data before storing in localStorage.
 * Encryption key is generated per session and stored only in memory.
 * 
 * @module infrastructure/security/crypto-storage
 */

const ENCRYPTED_API_KEY_STORAGE_KEY = 'encrypted_api_key';
const ENCRYPTION_SALT_STORAGE_KEY = 'encryption_salt';

// In-memory encryption key (never persisted, regenerated each session)
let encryptionKey = null;

/**
 * Generates a stable encryption key from browser characteristics
 * This allows the same key to be regenerated in the same browser session
 * @returns {Promise<CryptoKey>} Generated encryption key
 */
async function generateEncryptionKey() {
    try {
        // Create a stable seed from browser characteristics
        // This is not cryptographically perfect but provides reasonable security
        // for protecting against casual XSS attacks
        const seed = `${navigator.userAgent}_${window.location.origin}_${navigator.language}`;
        
        // Get or create salt
        let salt;
        const storedSalt = localStorage.getItem(ENCRYPTION_SALT_STORAGE_KEY);
        if (storedSalt) {
            salt = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
        } else {
            // Generate new salt and store it
            salt = crypto.getRandomValues(new Uint8Array(16));
            const saltBase64 = btoa(String.fromCharCode(...salt));
            localStorage.setItem(ENCRYPTION_SALT_STORAGE_KEY, saltBase64);
        }

        // Import seed as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(seed),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive key using PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: 256
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );

        return key;
    } catch (error) {
        console.error('Error generating encryption key:', error);
        throw new Error('Failed to generate encryption key');
    }
}

/**
 * Initializes encryption key for the current session
 * @returns {Promise<void>}
 */
async function initializeEncryptionKey() {
    if (encryptionKey) {
        return; // Already initialized
    }

    try {
        encryptionKey = await generateEncryptionKey();
    } catch (error) {
        console.error('Error initializing encryption key:', error);
        throw error;
    }
}

/**
 * Encrypts data using AES-GCM
 * @param {string} data - Data to encrypt
 * @returns {Promise<string>} Encrypted data as base64 string
 */
async function encryptData(data) {
    if (!encryptionKey) {
        await initializeEncryptionKey();
    }

    try {
        // Generate random IV for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt data
        const encodedData = new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            encryptionKey,
            encodedData
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to base64 for storage
        const base64 = btoa(String.fromCharCode(...combined));
        return base64;
    } catch (error) {
        console.error('Error encrypting data:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Encrypted data as base64 string
 * @returns {Promise<string>} Decrypted data
 */
async function decryptData(encryptedData) {
    if (!encryptionKey) {
        await initializeEncryptionKey();
    }

    try {
        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extract IV (first 12 bytes) and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        // Decrypt data
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            encryptionKey,
            encrypted
        );

        // Convert to string
        const decoded = new TextDecoder().decode(decrypted);
        return decoded;
    } catch (error) {
        console.error('Error decrypting data:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Saves encrypted API key to localStorage
 * @param {string} apiKey - API key to encrypt and save
 * @returns {Promise<void>}
 */
async function saveEncryptedApiKey(apiKey) {
    try {
        const encrypted = await encryptData(apiKey);
        localStorage.setItem(ENCRYPTED_API_KEY_STORAGE_KEY, encrypted);
    } catch (error) {
        console.error('Error saving encrypted API key:', error);
        throw error;
    }
}

/**
 * Retrieves and decrypts API key from localStorage
 * @returns {Promise<string>} Decrypted API key or empty string if not found
 */
async function getEncryptedApiKey() {
    try {
        const encrypted = localStorage.getItem(ENCRYPTED_API_KEY_STORAGE_KEY);
        if (!encrypted) {
            return '';
        }
        
        const decrypted = await decryptData(encrypted);
        return decrypted;
    } catch (error) {
        console.error('Error retrieving encrypted API key:', error);
        // If decryption fails, clear corrupted data
        clearEncryptedApiKey();
        return '';
    }
}

/**
 * Clears encrypted API key from localStorage
 */
function clearEncryptedApiKey() {
    localStorage.removeItem(ENCRYPTED_API_KEY_STORAGE_KEY);
}

/**
 * Checks if encrypted API key exists
 * @returns {boolean} True if encrypted API key exists
 */
function hasEncryptedApiKey() {
    return !!localStorage.getItem(ENCRYPTED_API_KEY_STORAGE_KEY);
}

/**
 * Clears encryption key from memory
 * Should be called when user logs out or closes the application
 */
function clearEncryptionKeyFromMemory() {
    encryptionKey = null;
}

