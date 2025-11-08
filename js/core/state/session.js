/**
 * Session State Management
 * 
 * Manages interview session state including topics, topic states, and navigation.
 * 
 * @module core/state/session
 */

/**
 * @typedef {Object} Topic
 * @property {string} name - Topic name
 * @property {number} importance - Importance level (1-5)
 * @property {string} required_level - Required level: 'basic' | 'solid' | 'deep'
 * @property {string[]} merged_from - Merged topics
 */

/**
 * @typedef {Object} QAPair
 * @property {string} question - Question text
 * @property {string} answer - Answer text
 */

/**
 * @typedef {Object} Verdict
 * @property {string} name - Topic name
 * @property {string} assessed_level - Assessed level: 'basic' | 'solid' | 'deep'
 * @property {number} score - Score (0-5)
 * @property {number} confidence - Confidence level (0-1)
 * @property {string[]} strengths - List of strengths
 * @property {string[]} gaps - List of gaps
 */

/**
 * @typedef {Object} TopicState
 * @property {string} status - Status: 'not_started' | 'probing' | 'done'
 * @property {QAPair[]} qaList - List of Q&A pairs
 * @property {Verdict|null} verdict - Final verdict (null if not completed)
 */

/**
 * @typedef {Object} Session
 * @property {string} apiKey - OpenAI API key
 * @property {Topic[]} topics - Array of interview topics
 * @property {Object<number, TopicState>} topicStates - Topic states by index
 * @property {number} currentTopicIndex - Current topic index
 * @property {boolean} enableFinalSummary - Enable final summary
 * @property {number} maxQuestionsPerTopic - Max questions per topic
 * @property {Object<number, Object>} prefetchedQuestions - Prefetched questions by topic index
 * @property {Promise[]} backgroundVerdictPromises - Background verdict promises
 */

let session = null;

/**
 * Initializes interview session with topics
 * @param {Topic[]} topics - Array of interview topics
 * @param {string} apiKey - OpenAI API key
 * @param {number} maxQuestionsPerTopic - Max questions per topic
 * @param {boolean} enableFinalSummary - Enable final summary generation
 * @returns {Session} Initialized session object
 * @throws {Error} If topics array is invalid or empty
 */
function initializeSession(topics, apiKey, maxQuestionsPerTopic, enableFinalSummary) {
    if (!Array.isArray(topics) || topics.length === 0) {
        throw new Error('Topics array must be non-empty');
    }
    
    // Validate each topic has required fields
    topics.forEach((topic, index) => {
        if (!topic.name || typeof topic.name !== 'string') {
            throw new Error(`Topic at index ${index} is missing name`);
        }
        if (typeof topic.importance !== 'number' || topic.importance < 1 || topic.importance > 5) {
            throw new Error(`Topic ${topic.name} has invalid importance: ${topic.importance}`);
        }
        if (!topic.required_level || !['basic', 'solid', 'deep'].includes(topic.required_level)) {
            throw new Error(`Topic ${topic.name} has invalid required_level: ${topic.required_level}`);
        }
    });
    
    session = {
        apiKey: apiKey,
        topics: topics,
        topicStates: {},
        currentTopicIndex: 0,
        enableFinalSummary: enableFinalSummary || false,
        maxQuestionsPerTopic: maxQuestionsPerTopic || 5,
        prefetchedQuestions: {}, // Store prefetched questions by topic index
        backgroundVerdictPromises: [] // Track background verdict promises
    };
    
    // Initialize topic states
    topics.forEach((topic, index) => {
        session.topicStates[index] = {
            status: TOPIC_STATUS.NOT_STARTED,
            qaList: [],
            verdict: null
        };
    });
    
    // Save to cache
    saveSessionToCache(null, 'interview');
    
    return session;
}

/**
 * Gets the current session object
 * @returns {Session|null} Current session or null
 */
function getSession() {
    return session;
}

/**
 * Sets the session object (used for restoration)
 * @param {Session} newSession - Session object to set
 */
function setSession(newSession) {
    session = newSession;
}

/**
 * Gets the current topic
 * @returns {Topic|null} Current topic or null
 */
function getCurrentTopic() {
    if (!session || session.currentTopicIndex >= session.topics.length) {
        return null;
    }
    return session.topics[session.currentTopicIndex];
}

/**
 * Gets the current topic state
 * @returns {TopicState|null} Current topic state or null
 */
function getCurrentTopicState() {
    if (!session || session.currentTopicIndex >= session.topics.length) {
        return null;
    }
    return session.topicStates[session.currentTopicIndex];
}

/**
 * Adds a Q&A pair to the current topic
 * @param {string} question - Question text
 * @param {string} answer - Answer text
 */
function addQaToCurrentTopic(question, answer) {
    if (!session) return;
    
    const topicState = getCurrentTopicState();
    if (!topicState) return;
    
    topicState.qaList.push({
        question: question,
        answer: answer
    });
    
    topicState.status = TOPIC_STATUS.PROBING;
    
    // Save to cache
    saveSessionToCache(null, 'interview');
}

/**
 * Sets the verdict for the current topic
 * @param {Verdict} verdict - Verdict object
 */
function setCurrentTopicVerdict(verdict) {
    if (!session) return;
    
    const topicState = getCurrentTopicState();
    if (!topicState) return;
    
    topicState.verdict = verdict;
    topicState.status = TOPIC_STATUS.DONE;
    
    // Save to cache
    saveSessionToCache(null, 'interview');
}

/**
 * Moves to the next topic
 * @returns {boolean} True if moved to next topic, false if no more topics
 */
function moveToNextTopic() {
    if (!session) return false;
    
    if (session.currentTopicIndex < session.topics.length - 1) {
        session.currentTopicIndex++;
        saveSessionToCache(null, 'interview');
        return true;
    }
    
    return false;
}

/**
 * Checks if there are more topics after the current one
 * @returns {boolean} True if there are more topics
 */
function hasMoreTopics() {
    if (!session) return false;
    return session.currentTopicIndex < session.topics.length - 1;
}

/**
 * Gets all topic verdicts
 * @returns {Verdict[]} Array of all verdicts
 */
function getAllTopicVerdicts() {
    if (!session) return [];
    
    const verdicts = [];
    session.topics.forEach((topic, index) => {
        const state = session.topicStates[index];
        if (state && state.verdict) {
            verdicts.push(state.verdict);
        }
    });
    
    return verdicts;
}

/**
 * Gets all completed topics with their verdicts
 * @returns {Array<{topic: Topic, verdict: Verdict}>} Array of completed topics
 */
function getCompletedTopics() {
    if (!session) return [];
    
    const completed = [];
    session.topics.forEach((topic, index) => {
        const state = session.topicStates[index];
        if (state && state.status === TOPIC_STATUS.DONE && state.verdict) {
            completed.push({
                topic: topic,
                verdict: state.verdict
            });
        }
    });
    
    return completed;
}

/**
 * Gets all incomplete topics
 * @returns {Array<{topic: Topic, index: number, state: TopicState}>} Array of incomplete topics
 */
function getIncompleteTopics() {
    if (!session) return [];
    
    const incomplete = [];
    session.topics.forEach((topic, index) => {
        const state = session.topicStates[index];
        if (state && (state.status === TOPIC_STATUS.NOT_STARTED || state.status === TOPIC_STATUS.PROBING)) {
            incomplete.push({
                topic: topic,
                index: index,
                state: state
            });
        }
    });
    
    return incomplete;
}

/**
 * Checks if the current topic should continue
 * @returns {boolean} True if should continue with current topic
 */
function shouldContinueCurrentTopic() {
    if (!session) return false;
    
    const topicState = getCurrentTopicState();
    if (!topicState) return false;
    
    // Continue if we haven't reached max questions and don't have a verdict yet
    return topicState.qaList.length < session.maxQuestionsPerTopic && 
           topicState.status !== TOPIC_STATUS.DONE;
}

