/**
 * Agents API
 * 
 * Agent-specific API calls for Planner, TopicAgent, and FinalSummary.
 * 
 * @module infrastructure/api/agents-api
 */

/**
 * Calls the Planner agent to generate interview topics
 * @param {string} apiKey - OpenAI API key
 * @param {string} jobDescription - Job description text
 * @param {string} candidateCV - Candidate CV/resume text
 * @returns {Promise<Object>} Planner response with topics array
 * @throws {Error} If config is not loaded or system prompt is empty
 */
async function callPlanner(apiKey, jobDescription, candidateCV) {
    const config = getConfig();
    if (!config || !config.roles[ROLE_NAMES.PLANNER].systemPrompt || !config.roles[ROLE_NAMES.PLANNER].systemPrompt.trim()) {
        throw new Error('Planner system prompt is empty or not configured');
    }
    
    const roleConfig = config.roles[ROLE_NAMES.PLANNER];
    const messages = [
        {
            role: 'system',
            content: roleConfig.systemPrompt
        },
        {
            role: 'user',
            content: JSON.stringify({
                job_description: jobDescription,
                candidate_cv: candidateCV
            })
        }
    ];
    
    return await callOpenAI(
        ROLE_NAMES.PLANNER,
        apiKey,
        messages,
        roleConfig.model,
        true, // useJsonSchema
        roleConfig.max_output_tokens ?? 5000,
        roleConfig.reasoning_effort ?? 'medium'
    );
}

/**
 * Calls the TopicAgent to get a question or verdict for a topic
 * @param {string} apiKey - OpenAI API key
 * @param {string} topicName - Topic name
 * @param {string} requiredLevel - Required level: 'basic' | 'solid' | 'deep'
 * @param {number} maxQuestions - Maximum questions per topic
 * @param {Array<{question: string, answer: string}>} recentQA - Recent Q&A pairs
 * @param {string|null} lastAnswer - Last answer (for language detection)
 * @returns {Promise<Object>} TopicAgent response with question or verdict
 * @throws {Error} If config is not loaded or system prompt is empty
 */
async function callTopicAgent(apiKey, topicName, requiredLevel, maxQuestions, recentQA, lastAnswer) {
    const config = getConfig();
    if (!config || !config.roles[ROLE_NAMES.TOPIC_AGENT].systemPrompt || !config.roles[ROLE_NAMES.TOPIC_AGENT].systemPrompt.trim()) {
        throw new Error('TopicAgent system prompt is empty or not configured');
    }
    
    const roleConfig = config.roles[ROLE_NAMES.TOPIC_AGENT];
    
    // Build input with topic info and Q&A history
    const topicAgentInput = {
        topic_name: topicName,
        required_level: requiredLevel,
        max_questions: maxQuestions,
        questions_asked: recentQA ? recentQA.length : 0,
        recent_qa: recentQA || []
    };
    
    // Add last answer if available (for language detection)
    if (lastAnswer) {
        topicAgentInput.recent_answer = lastAnswer;
    }
    
    const messages = [
        {
            role: 'system',
            content: roleConfig.systemPrompt
        },
        {
            role: 'user',
            content: JSON.stringify(topicAgentInput)
        }
    ];
    
    return await callOpenAI(
        ROLE_NAMES.TOPIC_AGENT,
        apiKey,
        messages,
        roleConfig.model,
        true, // useJsonSchema
        roleConfig.max_output_tokens ?? 2000,
        roleConfig.reasoning_effort ?? 'medium'
    );
}

/**
 * Calls the FinalSummary agent to generate final summary
 * @param {string} apiKey - OpenAI API key
 * @param {Array<Object>} topicVerdicts - Array of topic verdicts
 * @returns {Promise<Object>} FinalSummary response with per-topic summary and overall fit
 * @throws {Error} If config is not loaded or system prompt is empty
 */
async function callFinalSummary(apiKey, topicVerdicts) {
    const config = getConfig();
    if (!config || !config.roles[ROLE_NAMES.FINAL_SUMMARY].systemPrompt || !config.roles[ROLE_NAMES.FINAL_SUMMARY].systemPrompt.trim()) {
        throw new Error('FinalSummary system prompt is empty or not configured');
    }
    
    const roleConfig = config.roles[ROLE_NAMES.FINAL_SUMMARY];
    
    const messages = [
        {
            role: 'system',
            content: roleConfig.systemPrompt
        },
        {
            role: 'user',
            content: JSON.stringify({
                topic_verdicts: topicVerdicts
            })
        }
    ];
    
    return await callOpenAI(
        ROLE_NAMES.FINAL_SUMMARY,
        apiKey,
        messages,
        roleConfig.model,
        true, // useJsonSchema
        roleConfig.max_output_tokens ?? 3000,
        roleConfig.reasoning_effort ?? 'medium'
    );
}

