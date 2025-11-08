// API Key Manager - Manages OpenAI API key storage and UI

// In-memory cache for decrypted API key (for synchronous access)
let cachedApiKey = null;
let isInitialized = false;

/**
 * Initializes API key from encrypted storage
 * Should be called once at app startup
 * @returns {Promise<void>}
 */
async function initializeApiKey() {
    if (isInitialized) {
        return;
    }

    try {
        // Try to load from encrypted storage
        const encryptedKey = await getEncryptedApiKey();
        if (encryptedKey) {
            cachedApiKey = encryptedKey;
        } else {
            // Try to migrate old unencrypted key
            const oldKey = localStorage.getItem('openai_api_key');
            if (oldKey) {
                // Migrate to encrypted storage
                await saveEncryptedApiKey(oldKey);
                cachedApiKey = oldKey;
                // Remove old unencrypted key
                localStorage.removeItem('openai_api_key');
            }
        }
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing API key:', error);
        isInitialized = true; // Mark as initialized to prevent infinite retries
    }
}

/**
 * Gets API key from memory cache (synchronous)
 * @returns {string} API key or empty string
 */
function getApiKey() {
    return cachedApiKey || '';
}

/**
 * Saves API key to encrypted storage
 * @param {string} apiKey - API key to save
 * @returns {Promise<void>}
 */
async function saveApiKey(apiKey) {
    try {
        await saveEncryptedApiKey(apiKey);
        cachedApiKey = apiKey; // Update cache
        updateApiKeyUI();
    } catch (error) {
        console.error('Error saving API key:', error);
        throw error;
    }
}

function validateApiKey(apiKey) {
    if (!apiKey || !apiKey.trim()) {
        return { valid: false, error: 'API key is required' };
    }
    if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'Invalid API key format. OpenAI keys start with "sk-"' };
    }
    return { valid: true };
}

function updateApiKeyUI() {
    const apiKey = getApiKey();
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');
    
    if (!apiKeyStatus || !changeApiKeyBtn) return;
    
    if (apiKey) {
        // Show status and change button
        apiKeyStatus.classList.remove('hidden');
        changeApiKeyBtn.classList.remove('hidden');
    } else {
        // Hide status and change button (user needs to enter key via modal)
        apiKeyStatus.classList.add('hidden');
        changeApiKeyBtn.classList.add('hidden');
    }
}

function showApiKeyModal() {
    const modal = domCache.get('apiKeyModal');
    const input = domCache.get('apiKeyInput');
    const error = domCache.get('apiKeyError');
    
    if (!modal || !input || !error) return;
    
    input.value = '';
    error.classList.add('hidden');
    error.textContent = '';
    modal.classList.remove('hidden');
    input.focus();
}

function hideApiKeyModal() {
    const modal = domCache.get('apiKeyModal');
    if (modal) modal.classList.add('hidden');
}

async function handleApiKeySave() {
    const input = domCache.get('apiKeyInput');
    const error = domCache.get('apiKeyError');
    
    if (!input || !error) return;
    
    const apiKey = input.value.trim();
    
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
        error.textContent = validation.error;
        error.classList.remove('hidden');
        return;
    }
    
    try {
        await saveApiKey(apiKey);
        hideApiKeyModal();
        showNotification('API key saved successfully', 'success');
    } catch (error) {
        error.textContent = 'Failed to save API key. Please try again.';
        error.classList.remove('hidden');
    }
}

