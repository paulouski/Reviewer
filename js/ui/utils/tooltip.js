// Tooltip utilities for model pricing

/**
 * Creates and sets up a pricing tooltip for a model pricing icon
 * @param {HTMLElement} pricingIcon - The icon element that triggers the tooltip
 * @param {string} role - The role name (e.g., 'planner', 'interviewer')
 * @param {Object} modelPricing - Object mapping model names to pricing info
 * @param {string[]} availableModels - Array of available model names
 * @param {HTMLElement} modalContainer - Container element to append tooltip to
 */
function setupModelPricingTooltip(pricingIcon, role, modelPricing, availableModels, modalContainer) {
    if (!pricingIcon || !modalContainer) return;
    
    let tooltip = document.getElementById(`tooltip-${role}-pricing`);
    
    if (!tooltip) {
        // Create tooltip element
        tooltip = document.createElement('div');
        tooltip.className = 'model-pricing-tooltip hidden fixed z-[60] bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 w-64';
        tooltip.id = `tooltip-${role}-pricing`;
        
        // Build tooltip content with all models
        let tooltipContent = '<div class="font-semibold mb-2 text-white">Model Pricing</div><div class="space-y-2 text-xs">';
        availableModels.forEach((model, index) => {
            if (modelPricing[model]) {
                const pricing = modelPricing[model];
                const isLast = index === availableModels.length - 1;
                tooltipContent += `
                    <div class="${!isLast ? 'border-b border-gray-700 pb-2 mb-2' : ''}">
                        <div class="font-medium text-white">${model}</div>
                        <div class="text-gray-300 mt-1">
                            <div>Input: ${pricing.input} / 1M tokens</div>
                            <div>Output: ${pricing.output} / 1M tokens</div>
                        </div>
                    </div>
                `;
            }
        });
        tooltipContent += '</div>';
        tooltip.innerHTML = tooltipContent;
        
        // Append tooltip to modal container
        modalContainer.appendChild(tooltip);
        
        // Function to position tooltip
        const positionTooltip = () => {
            const iconRect = pricingIcon.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Position to the right of icon
            let left = iconRect.right + 8;
            let top = iconRect.top + (iconRect.height / 2) - (tooltipRect.height / 2);
            
            // Adjust if tooltip goes off screen
            if (left + tooltipRect.width > viewportWidth - 10) {
                // Position to the left instead
                left = iconRect.left - tooltipRect.width - 8;
            }
            
            // Adjust vertical position if goes off screen
            if (top < 10) {
                top = 10;
            } else if (top + tooltipRect.height > window.innerHeight - 10) {
                top = window.innerHeight - tooltipRect.height - 10;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        };
        
        // Add hover event listeners
        pricingIcon.addEventListener('mouseenter', () => {
            tooltip.classList.remove('hidden');
            positionTooltip();
        });
        
        pricingIcon.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
        
        // Update position on scroll/resize
        window.addEventListener('scroll', () => {
            if (!tooltip.classList.contains('hidden')) {
                positionTooltip();
            }
        }, true);
        
        window.addEventListener('resize', () => {
            if (!tooltip.classList.contains('hidden')) {
                positionTooltip();
            }
        });
    }
}

