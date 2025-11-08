// Agent Validator - Centralized validation for agent responses

/**
 * Validates TopicAgent response with status='ask'
 * @param {Object} output - TopicAgent output
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateTopicAgentAsk(output) {
    if (!output) {
        return { valid: false, error: 'TopicAgent returned empty response' };
    }
    
    const validation = validateResponse(ROLE_NAMES.TOPIC_AGENT, output);
    if (!validation.valid) {
        return { valid: false, error: `TopicAgent validation failed: ${validation.errors.join('; ')}` };
    }
    
    if (output.status !== AGENT_STATUS.ASK || !output.question || !output.question.text) {
        return { valid: false, error: 'TopicAgent did not return a question' };
    }
    
    return { valid: true };
}

/**
 * Validates TopicAgent response with status='final'
 * @param {Object} output - TopicAgent output
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateTopicAgentFinal(output) {
    if (!output) {
        return { valid: false, error: 'TopicAgent returned empty response' };
    }
    
    const validation = validateResponse(ROLE_NAMES.TOPIC_AGENT, output);
    if (!validation.valid) {
        return { valid: false, error: `TopicAgent validation failed: ${validation.errors.join('; ')}` };
    }
    
    if (output.status !== AGENT_STATUS.FINAL || !output.verdict) {
        return { valid: false, error: 'TopicAgent did not provide final verdict' };
    }
    
    return { valid: true };
}

/**
 * Validates Planner response
 * @param {Object} output - Planner output
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validatePlannerResponse(output) {
    if (!output) {
        return { valid: false, error: 'Planner returned empty response' };
    }
    
    const validation = validateResponse(ROLE_NAMES.PLANNER, output);
    if (!validation.valid) {
        return { valid: false, error: `Planner validation failed: ${validation.errors.join('; ')}` };
    }
    
    // Additional check for topics array
    if (!output.topics || !Array.isArray(output.topics) || output.topics.length === 0) {
        return { valid: false, error: 'Planner did not return valid topics array' };
    }
    
    return { valid: true };
}

/**
 * Validates FinalSummary response
 * @param {Object} output - FinalSummary output
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateFinalSummaryResponse(output) {
    if (!output) {
        return { valid: false, error: 'FinalSummary returned empty response' };
    }
    
    const validation = validateResponse(ROLE_NAMES.FINAL_SUMMARY, output);
    if (!validation.valid) {
        return { valid: false, error: `FinalSummary validation failed: ${validation.errors.join('; ')}` };
    }
    
    return { valid: true };
}

/**
 * Validates TopicAgent response (general - checks both ask and final)
 * @param {Object} output - TopicAgent output
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateTopicAgentResponse(output) {
    if (!output) {
        return { valid: false, error: 'TopicAgent returned empty response' };
    }
    
    const validation = validateResponse(ROLE_NAMES.TOPIC_AGENT, output);
    if (!validation.valid) {
        return { valid: false, error: `TopicAgent validation failed: ${validation.errors.join('; ')}` };
    }
    
    // Check if it's either ask or final
    if (output.status === AGENT_STATUS.ASK) {
        if (!output.question || !output.question.text) {
            return { valid: false, error: 'TopicAgent did not return a question' };
        }
    } else if (output.status === AGENT_STATUS.FINAL) {
        if (!output.verdict) {
            return { valid: false, error: 'TopicAgent did not provide final verdict' };
        }
    } else {
        return { valid: false, error: `Invalid TopicAgent status: ${output.status}` };
    }
    
    return { valid: true };
}

