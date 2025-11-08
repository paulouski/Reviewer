/**
 * DOM Helper Functions
 * 
 * Utility functions for DOM manipulation.
 * 
 * @module ui/utils/dom-helpers
 */

/**
 * Escapes HTML characters in text to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

