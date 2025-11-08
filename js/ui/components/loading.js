/**
 * Loading Component
 * 
 * Manages loading overlay display.
 * 
 * @module ui/components/loading
 */

/**
 * Shows loading overlay with message
 * @param {string} message - Loading message to display
 */
function showLoading(message = 'Processing...') {
    const overlay = domCache.get('loadingOverlay');
    const text = domCache.get('loadingText');
    if (text) text.textContent = message;
    if (overlay) overlay.classList.remove('hidden');
}

/**
 * Hides loading overlay
 */
function hideLoading() {
    const overlay = domCache.get('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

