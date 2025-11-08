// Validation utilities

/**
 * Validates job description input
 * @param {string} jobDescription - The job description text
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateJobDescription(jobDescription) {
    if (!jobDescription || !jobDescription.trim()) {
        return { valid: false, error: 'Job description is required' };
    }
    
    if (jobDescription.trim().length < 50) {
        return { valid: false, error: 'Job description must be at least 50 characters long' };
    }
    
    if (jobDescription.length > 10000) {
        return { valid: false, error: 'Job description is too long (maximum 10,000 characters)' };
    }
    
    return { valid: true };
}

/**
 * Validates candidate CV/resume input
 * @param {string} candidateCV - The candidate CV text
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateCandidateCV(candidateCV) {
    if (!candidateCV || !candidateCV.trim()) {
        return { valid: false, error: 'CV/Resume is required' };
    }
    
    if (candidateCV.trim().length < 50) {
        return { valid: false, error: 'CV/Resume must be at least 50 characters long' };
    }
    
    if (candidateCV.length > 20000) {
        return { valid: false, error: 'CV/Resume is too long (maximum 20,000 characters)' };
    }
    
    return { valid: true };
}

/**
 * Validates answer input
 * @param {string} answer - The answer text
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateAnswer(answer) {
    if (!answer || !answer.trim()) {
        return { valid: false, error: 'Please enter an answer' };
    }
    
    if (answer.length > 5000) {
        return { valid: false, error: 'Answer is too long (maximum 5,000 characters)' };
    }
    
    return { valid: true };
}

