// Form Cache - Manages form data caching in sessionStorage

const FORM_CACHE_KEY = 'interview_form_cache';

/**
 * Saves job description and CV to sessionStorage
 * @param {string} jobDescription - Job description text
 * @param {string} cv - Candidate CV text
 */
function saveFormData(jobDescription, cv) {
    try {
        const formData = {
            jobDescription: jobDescription || '',
            cv: cv || ''
        };
        sessionStorage.setItem(FORM_CACHE_KEY, JSON.stringify(formData));
    } catch (error) {
        console.error('Error saving form data to cache:', error);
    }
}

/**
 * Loads job description and CV from sessionStorage
 * @returns {Object|null} Object with jobDescription and cv properties, or null if not found
 */
function loadFormData() {
    try {
        const cachedData = sessionStorage.getItem(FORM_CACHE_KEY);
        if (!cachedData) {
            return null;
        }
        
        const formData = JSON.parse(cachedData);
        return {
            jobDescription: formData.jobDescription || '',
            cv: formData.cv || ''
        };
    } catch (error) {
        console.error('Error loading form data from cache:', error);
        return null;
    }
}

/**
 * Clears form data from sessionStorage
 */
function clearFormData() {
    try {
        sessionStorage.removeItem(FORM_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing form data cache:', error);
    }
}

