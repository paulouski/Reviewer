// Error Handler - Centralized error handling

/**
 * Error types for categorization
 */
const ErrorType = {
    NETWORK: 'network',
    API: 'api',
    VALIDATION: 'validation',
    UNKNOWN: 'unknown'
};

/**
 * Handles errors and provides user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'startInterview', 'handleAnswerSubmit')
 * @param {ErrorType} errorType - Type of error for better handling
 * @returns {string} User-friendly error message
 */
function handleError(error, context = '', errorType = ErrorType.UNKNOWN) {
    // Log error details for debugging
    console.error(`Error in ${context}:`, error);
    
    let userMessage = 'An unexpected error occurred';
    
    // Handle different error types
    if (errorType === ErrorType.NETWORK) {
        userMessage = 'Network error. Please check your internet connection and try again.';
    } else if (errorType === ErrorType.API) {
        if (error.message && error.message.includes('401')) {
            userMessage = 'Invalid API key. Please check your API key and try again.';
        } else if (error.message && error.message.includes('429')) {
            userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message && error.message.includes('500')) {
            userMessage = 'Server error. Please try again later.';
        } else if (error.message) {
            userMessage = `API Error: ${error.message}`;
        } else {
            userMessage = 'API request failed. Please try again.';
        }
    } else if (errorType === ErrorType.VALIDATION) {
        userMessage = error.message || 'Validation error occurred';
    } else if (error.message) {
        userMessage = error.message;
    }
    
    // Show notification to user
    showNotification(userMessage, 'error');
    
    return userMessage;
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context name for error reporting
 * @param {ErrorType} errorType - Expected error type
 * @returns {Function} Wrapped function
 */
function withErrorHandling(fn, context, errorType = ErrorType.UNKNOWN) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, context, errorType);
            throw error; // Re-throw to allow caller to handle if needed
        }
    };
}

