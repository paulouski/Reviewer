/**
 * Configuration Tabs
 * 
 * Manages configuration tabs UI (generation, switching).
 * 
 * @module features/config/config-tabs
 */

/**
 * Generates HTML for a config tab
 * @param {string} role - Role name (e.g., 'planner')
 * @param {string} roleName - Display name (e.g., 'Planner')
 * @returns {string} HTML string for the tab content
 */
function generateConfigTabContent(role, roleName) {
    return `
        <div id="tab-${role}" class="config-tab-content hidden">
            <h4 class="text-lg font-semibold mb-4">${roleName}</h4>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Model
                        <span class="model-pricing-icon inline-block ml-2 cursor-help relative" data-role="${role}">
                            ${MODEL_PRICING_ICON_SVG}
                        </span>
                    </label>
                    <select id="config-${role}-model" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Max Output Tokens</label>
                    <input type="number" id="config-${role}-max-tokens" class="w-full px-4 py-2 border border-gray-300 rounded-lg" min="50" max="5000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Reasoning Effort</label>
                    <select id="config-${role}-reasoning" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="low" selected>Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                    <textarea id="config-${role}-prompt" rows="12" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">JSON Schema (Read-Only)</label>
                    <textarea id="config-${role}-schema" readonly 
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm bg-gray-50 text-gray-600" 
                        rows="8"></textarea>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initializes config tabs by generating them dynamically
 */
function initializeConfigTabs() {
    // Find the tab content container within the config modal
    const configModal = document.getElementById('configModal');
    if (!configModal) {
        console.error('Config modal not found');
        return;
    }
    
    const tabContentContainer = configModal.querySelector('.flex-1.overflow-y-auto.p-6');
    if (!tabContentContainer) {
        console.error('Config tab content container not found');
        return;
    }
    
    // Check if tabs are already generated
    if (document.getElementById('tab-planner')) {
        return; // Tabs already exist
    }
    
    // Generate tabs for each role
    const roles = [
        { role: ROLE_NAMES.PLANNER, name: 'Planner' },
        { role: ROLE_NAMES.TOPIC_AGENT, name: 'TopicAgent' },
        { role: ROLE_NAMES.FINAL_SUMMARY, name: 'FinalSummary' }
    ];
    
    roles.forEach(({ role, name }) => {
        const tabHTML = generateConfigTabContent(role, name);
        tabContentContainer.insertAdjacentHTML('beforeend', tabHTML);
    });
}

/**
 * Shows a specific config tab
 * @param {string} tabName - Tab name to show
 */
function showConfigTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.config-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Add active class to selected tab
    const tabButton = document.querySelector(`.config-tab[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
}

// Initialize config modal event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize config tabs dynamically
    initializeConfigTabs();
    
    // Tab switching
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            showConfigTab(tabName);
        });
    });
    
    // Close buttons
    document.getElementById('closeConfigBtn')?.addEventListener('click', closeConfigModal);
    document.getElementById('cancelConfigBtn')?.addEventListener('click', closeConfigModal);
    
    // Save button
    document.getElementById('saveConfigBtn')?.addEventListener('click', saveConfig);
    
    // Reset button
    document.getElementById('resetConfigBtn')?.addEventListener('click', resetConfigToDefault);
    
    // Open config buttons
    document.getElementById('configBtn')?.addEventListener('click', openConfigModal);
    document.getElementById('configBtnInterview')?.addEventListener('click', openConfigModal);
    
    // Close on overlay click
    document.getElementById('configModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'configModal') {
            closeConfigModal();
        }
    });
});

