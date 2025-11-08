/**
 * UI State Management
 * 
 * Manages UI-specific state such as current question and processing flags.
 * 
 * @module core/state/ui-state
 */

/**
 * @typedef {Object} CurrentQuestion
 * @property {string} text - Question text
 * @property {number} topicIndex - Topic index
 */

let currentQuestion = null;
let isProcessing = false; // Flag to prevent duplicate requests

/**
 * Gets the current question
 * @returns {CurrentQuestion|null} Current question or null
 */
function getCurrentQuestion() {
    return currentQuestion;
}

/**
 * Sets the current question
 * @param {CurrentQuestion|null} question - Question object or null
 */
function setCurrentQuestion(question) {
    currentQuestion = question;
}

/**
 * Checks if the application is currently processing a request
 * @returns {boolean} True if processing
 */
function isProcessingRequest() {
    return isProcessing;
}

/**
 * Sets the processing flag
 * @param {boolean} flag - Processing flag value
 */
function setProcessing(flag) {
    isProcessing = flag;
}

