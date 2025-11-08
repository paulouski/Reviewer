/**
 * Configuration State Management
 * 
 * Manages application configuration including role settings and application settings.
 * 
 * @module core/state/config
 */

/**
 * @typedef {Object} RoleConfig
 * @property {string} name - Role name
 * @property {string} model - Model name
 * @property {string[]} availableModels - Available models
 * @property {number} max_output_tokens - Max output tokens
 * @property {string} reasoning_effort - Reasoning effort: 'low' | 'medium' | 'high'
 * @property {string} systemPrompt - System prompt
 */

/**
 * @typedef {Object} AppConfig
 * @property {Object<string, RoleConfig>} roles - Role configurations
 * @property {Object} settings - Application settings
 * @property {number} settings.maxQuestionsPerTopic - Max questions per topic
 * @property {number} settings.maxTopics - Max topics
 */

let config = null;

/**
 * Loads configuration from localStorage or uses embedded default
 * @returns {Promise<AppConfig>} Configuration object
 */
async function loadConfig() {
    try {
        // Load schemas first
        await loadSchemas();
        
        // Try to load from localStorage first
        const savedConfig = localStorage.getItem('interview_config');
        if (savedConfig) {
            config = JSON.parse(savedConfig);
            return config;
        }
        
        // Use embedded config directly (no file loading due to CORS issues with file:// protocol)
        config = JSON.parse(JSON.stringify(EMBEDDED_CONFIG));
        
        // Save to localStorage for future use
        localStorage.setItem('interview_config', JSON.stringify(config));
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback to embedded config
        config = JSON.parse(JSON.stringify(EMBEDDED_CONFIG));
        return config;
    }
}

/**
 * Gets the current configuration
 * @returns {AppConfig|null} Current configuration or null
 */
function getConfig() {
    return config;
}

/**
 * Sets the configuration (used for restoration)
 * @param {AppConfig} newConfig - Configuration object to set
 */
function setConfig(newConfig) {
    config = newConfig;
}

/**
 * Saves configuration to localStorage
 * Updates config from form inputs and saves to localStorage
 */
function saveConfig() {
    if (!config) return;
    
    // Update config from form
    [ROLE_NAMES.PLANNER, ROLE_NAMES.TOPIC_AGENT, ROLE_NAMES.FINAL_SUMMARY].forEach(role => {
        const roleConfig = config.roles[role];
        roleConfig.model = document.getElementById(`config-${role}-model`).value;
        roleConfig.systemPrompt = document.getElementById(`config-${role}-prompt`).value;
        
        // Save new fields
        const maxTokensInput = document.getElementById(`config-${role}-max-tokens`);
        const reasoningSelect = document.getElementById(`config-${role}-reasoning`);
        
        if (maxTokensInput) {
            roleConfig.max_output_tokens = parseInt(maxTokensInput.value);
        }
        if (reasoningSelect) {
            roleConfig.reasoning_effort = reasoningSelect.value;
        }
    });
    
    // Update settings
    config.settings.maxQuestionsPerTopic = parseInt(document.getElementById('config-max-questions-per-topic').value);
    config.settings.maxTopics = parseInt(document.getElementById('config-max-topics').value);
    
    // Update schema maxItems for planner topics
    updatePlannerMaxTopics(config.settings.maxTopics);
    
    // Save to localStorage
    localStorage.setItem('interview_config', JSON.stringify(config));
    
    // Close modal and show notification (handled by config-ui.js)
    if (typeof closeConfigModal === 'function') {
        closeConfigModal();
    }
    showNotification('Configuration saved successfully!');
}

/**
 * Resets configuration to default embedded values
 * @returns {Promise<void>}
 */
async function resetConfigToDefault() {
    if (!confirm('Are you sure you want to reset configuration to default? This will reload the default configuration and override your current settings.')) {
        return;
    }
    
    // Clear config from localStorage
    localStorage.removeItem('interview_config');
    
    // Use embedded config directly (no file loading due to CORS issues with file:// protocol)
    config = JSON.parse(JSON.stringify(EMBEDDED_CONFIG));
    
    // Save config to localStorage
    localStorage.setItem('interview_config', JSON.stringify(config));
    
    // Reset schemas to default
    resetSchemasToDefault();
    
    // Close modal and show notification (handled by config-ui.js)
    if (typeof closeConfigModal === 'function') {
        closeConfigModal();
    }
    showNotification('Configuration reset to default successfully!');
}

