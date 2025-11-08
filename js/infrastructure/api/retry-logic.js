/**
 * Retry Logic
 * 
 * Provides retry mechanism for API requests with exponential backoff.
 * 
 * @module infrastructure/api/retry-logic
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} maxRetries - Maximum number of retry attempts
 * @property {number} retryDelay - Base delay in milliseconds
 * @property {number[]} retryableStatuses - HTTP status codes that should be retried
 * @property {string[]} retryableErrors - Error messages that should be retried
 */

/**
 * Default retry configuration
 * @type {RetryConfig}
 */
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    retryableStatuses: [429, 500, 502, 503, 504], // HTTP status codes that should be retried
    retryableErrors: ['Network request failed', 'fetch'] // Error messages that should be retried
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determines if an error should be retried
 * @param {Error} error - The error object
 * @param {number|null} statusCode - HTTP status code (if available)
 * @param {RetryConfig} retryConfig - Retry configuration
 * @returns {boolean} True if error should be retried
 */
function shouldRetry(error, statusCode, retryConfig = DEFAULT_RETRY_CONFIG) {
    // Retry on network errors
    if (error instanceof TypeError || error.message.includes('fetch') || error.message.includes('Network')) {
        return true;
    }
    
    // Retry on specific HTTP status codes
    if (statusCode && retryConfig.retryableStatuses.includes(statusCode)) {
        return true;
    }
    
    // Retry on specific error messages
    if (retryConfig.retryableErrors.some(msg => error.message.includes(msg))) {
        return true;
    }
    
    return false;
}

/**
 * Makes an API request with retry logic
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @param {RetryConfig} retryConfig - Retry configuration
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options, retryConfig = DEFAULT_RETRY_CONFIG) {
    let lastError;
    let lastStatusCode;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            // If response is ok, return it
            if (response.ok) {
                return response;
            }
            
            // Check if we should retry this status code
            if (shouldRetry(new Error(`HTTP ${response.status}`), response.status, retryConfig) && attempt < retryConfig.maxRetries) {
                lastStatusCode = response.status;
                const delay = retryConfig.retryDelay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`API request failed with status ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
                await sleep(delay);
                continue;
            }
            
            // If we shouldn't retry or max retries reached, return the response
            return response;
        } catch (error) {
            lastError = error;
            
            // Check if we should retry this error
            if (shouldRetry(error, null, retryConfig) && attempt < retryConfig.maxRetries) {
                const delay = retryConfig.retryDelay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`API request failed: ${error.message}, retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
                await sleep(delay);
                continue;
            }
            
            // If we shouldn't retry or max retries reached, throw the error
            throw error;
        }
    }
    
    // If we exhausted retries, throw the last error
    if (lastError) {
        throw lastError;
    }
    
    // This shouldn't happen, but just in case
    throw new Error('API request failed after retries');
}

