/**
 * Configuration Modal
 * 
 * Manages the configuration modal UI (open/close).
 * 
 * @module features/config/config-modal
 */

let configModalOpen = false;

/**
 * Opens the configuration modal
 * Loads config and schemas, initializes tabs, and populates form fields
 * @returns {Promise<void>}
 */
async function openConfigModal() {
    // Ensure config is loaded before opening modal
    const config = getConfig();
    if (!config) {
        try {
            await loadConfig();
        } catch (error) {
            console.error('Failed to load config:', error);
            showNotification('Failed to load configuration', 'error');
            return;
        }
    }
    
    const currentConfig = getConfig();
    if (!currentConfig) {
        console.error('Config is still null after load attempt');
        showNotification('Configuration not available', 'error');
        return;
    }
    
    // Ensure schemas are loaded (initialize localStorage if needed)
    try {
        await loadSchemas();
    } catch (error) {
        console.error('Failed to load schemas:', error);
    }
    
    // Ensure tabs are generated before opening modal
    const plannerTab = document.getElementById('tab-planner');
    if (!plannerTab) {
        initializeConfigTabs();
    }
    
    configModalOpen = true;
    const modal = document.getElementById('configModal');
    modal.classList.remove('hidden');
    
    // Populate all role configs
    [ROLE_NAMES.PLANNER, ROLE_NAMES.TOPIC_AGENT, ROLE_NAMES.FINAL_SUMMARY].forEach(role => {
        const roleConfig = currentConfig.roles[role];
        const modelSelect = document.getElementById(`config-${role}-model`);
        const promptTextarea = document.getElementById(`config-${role}-prompt`);
        
        // Populate model dropdown
        modelSelect.innerHTML = '';
        const availableModels = roleConfig.availableModels || DEFAULT_AVAILABLE_MODELS;
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === roleConfig.model) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
        
        // Setup pricing tooltip for the question icon
        const pricingIcon = document.querySelector(`.model-pricing-icon[data-role="${role}"]`);
        if (pricingIcon) {
            const modal = document.getElementById('configModal');
            if (modal) {
                setupModelPricingTooltip(
                    pricingIcon,
                    role,
                    MODEL_PRICING,
                    DEFAULT_AVAILABLE_MODELS,
                    modal
                );
            }
        }
        
        // Populate prompt
        promptTextarea.value = roleConfig.systemPrompt || '';
        
        // Populate schema (read-only)
        const schemaTextarea = document.getElementById(`config-${role}-schema`);
        if (schemaTextarea) {
            const schemaText = formatSchemaForPrompt(role);
            schemaTextarea.value = schemaText || '';
        }
        
        // Populate new fields
        const maxTokensInput = document.getElementById(`config-${role}-max-tokens`);
        const reasoningSelect = document.getElementById(`config-${role}-reasoning`);
        
        if (maxTokensInput) {
            maxTokensInput.value = roleConfig.max_output_tokens ?? 1000;
        }
        if (reasoningSelect) {
            reasoningSelect.value = roleConfig.reasoning_effort ?? 'medium';
        }
    });
    
    // Populate settings
    document.getElementById('config-max-questions-per-topic').value = currentConfig.settings.maxQuestionsPerTopic || 5;
    document.getElementById('config-max-topics').value = currentConfig.settings.maxTopics || 10;
    
    // Show first tab
    showConfigTab(ROLE_NAMES.PLANNER);
}

/**
 * Closes the configuration modal
 */
function closeConfigModal() {
    configModalOpen = false;
    document.getElementById('configModal').classList.add('hidden');
}

