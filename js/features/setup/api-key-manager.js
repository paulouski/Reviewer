// API Key Manager - Manages OpenAI API key storage and UI

function getApiKey() {
    return localStorage.getItem('openai_api_key') || '';
}

function saveApiKey(apiKey) {
    localStorage.setItem('openai_api_key', apiKey);
    updateApiKeyUI();
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
    const apiKeyInput = domCache.get('apiKey');
    const apiKeyInputContainer = document.getElementById('apiKeyInputContainer');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');
    
    if (!apiKeyInput || !apiKeyInputContainer || !apiKeyStatus || !changeApiKeyBtn) return;
    
    if (apiKey) {
        // Hide input, show status and change button
        apiKeyInputContainer.classList.add('hidden');
        apiKeyStatus.classList.remove('hidden');
        changeApiKeyBtn.classList.remove('hidden');
        apiKeyInput.value = apiKey; // Keep value for form submission
    } else {
        // Show input, hide status and change button
        apiKeyInputContainer.classList.remove('hidden');
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

function handleApiKeySave() {
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
    
    saveApiKey(apiKey);
    hideApiKeyModal();
    showNotification('API key saved successfully', 'success');
}

