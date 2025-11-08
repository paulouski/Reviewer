/**
 * Application Entry Point
 * 
 * Main initialization file that sets up the application when DOM is ready.
 * Coordinates loading of configuration, API key setup, and session restoration.
 * 
 * @module core/app
 */

/**
 * Initializes the application when DOM is ready
 * - Loads configuration
 * - Checks and sets up API key
 * - Attempts to restore session from cache
 * - Sets up event listeners
 */
async function initializeApp() {
    // Load config first (required by other modules)
    await loadConfig();
    
    // Initialize API key from encrypted storage
    await initializeApiKey();
    
    // Check API key on load
    const apiKey = getApiKey();
    if (!apiKey) {
        showApiKeyModal();
    } else {
        updateApiKeyUI();
    }
    
    // Try to restore session from cache
    try {
        if (restoreSessionFromCache()) {
            showNotification('Session restored from cache', 'success');
        }
    } catch (error) {
        console.error('Failed to restore session:', error);
        showNotification('Failed to restore session. Starting fresh.', 'error');
        clearSessionCache();
    }
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Sets up all application event listeners
 */
function setupEventListeners() {
    // API Key Modal handlers
    document.getElementById('saveApiKeyBtn')?.addEventListener('click', handleApiKeySave);
    document.getElementById('apiKeyInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleApiKeySave();
        }
    });
    
    // Change API Key button
    document.getElementById('changeApiKeyBtn')?.addEventListener('click', () => {
        showApiKeyModal();
    });
    
    // Setup form submit
    document.getElementById('setupForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        startInterview();
    });
    
    // Answer submit
    document.getElementById('sendAnswerBtn')?.addEventListener('click', handleAnswerSubmit);
    document.getElementById('answerInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleAnswerSubmit();
        }
    });
    
    // End early button
    document.getElementById('endEarlyBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to end the interview early?')) {
            endInterview();
        }
    });
    
    // New interview button
    document.getElementById('newInterviewBtn')?.addEventListener('click', () => {
        session = null;
        currentQuestion = null;
        clearSessionCache();
        showScreen('setup');
        const dialogArea = domCache.get('dialogArea');
        if (dialogArea) {
            dialogArea.innerHTML = '';
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

