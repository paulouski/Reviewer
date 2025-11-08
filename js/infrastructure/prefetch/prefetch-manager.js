// Prefetch Manager - Manages prefetched questions and background verdict promises

// Prefetch next topic question in background
async function prefetchNextTopicQuestion() {
    if (!session) return;
    
    const nextTopicIndex = session.currentTopicIndex + 1;
    
    // Check if there's a next topic
    if (nextTopicIndex >= session.topics.length) {
        return; // No more topics
    }
    
    // Check if question is already prefetched
    if (getPrefetchedQuestion(nextTopicIndex)) {
        return; // Already prefetched
    }
    
    // Check if topic state already has questions (already started)
    const nextTopicState = session.topicStates[nextTopicIndex];
    if (nextTopicState && nextTopicState.qaList.length > 0) {
        return; // Topic already started, don't prefetch
    }
    
    const nextTopic = session.topics[nextTopicIndex];
    if (!nextTopic) {
        return;
    }
    
    try {
        // Silently prefetch in background
        const topicAgentOutput = await callTopicAgent(
            session.apiKey,
            nextTopic.name,
            nextTopic.required_level,
            session.maxQuestionsPerTopic,
            [], // Empty qaList for first question
            null
        );
        
        // Validate and store if valid
        const validation = validateTopicAgentAsk(topicAgentOutput);
        if (validation.valid) {
            const prefetchedData = {
                text: topicAgentOutput.question.text,
                topicIndex: nextTopicIndex,
                topicAgentOutput: topicAgentOutput
            };
            
            setPrefetchedQuestion(nextTopicIndex, prefetchedData);
            console.log(`Prefetched question for topic ${nextTopicIndex}: ${nextTopic.name}`);
        }
    } catch (error) {
        // Silently handle errors - don't show to user
        console.warn(`Failed to prefetch question for topic ${nextTopicIndex}:`, error);
    }
}

// Prefetched Questions Management Functions

function setPrefetchedQuestion(topicIndex, questionData) {
    if (!session) return;
    
    if (typeof topicIndex !== 'number' || topicIndex < 0 || topicIndex >= session.topics.length) {
        console.warn(`Invalid topic index for prefetch: ${topicIndex}`);
        return;
    }
    
    session.prefetchedQuestions[topicIndex] = questionData;
    saveSessionToCache(null, 'interview');
}

function getPrefetchedQuestion(topicIndex) {
    if (!session) return null;
    
    if (typeof topicIndex !== 'number' || topicIndex < 0 || topicIndex >= session.topics.length) {
        return null;
    }
    
    return session.prefetchedQuestions[topicIndex] || null;
}

function clearPrefetchedQuestion(topicIndex) {
    if (!session) return;
    
    if (session.prefetchedQuestions[topicIndex]) {
        delete session.prefetchedQuestions[topicIndex];
        saveSessionToCache(null, 'interview');
    }
}

function clearAllPrefetchedQuestions() {
    if (!session) return;
    
    session.prefetchedQuestions = {};
    saveSessionToCache(null, 'interview');
}

// Background Verdict Promise Management Functions

function addBackgroundVerdictPromise(promise) {
    if (!session) return;
    
    if (!session.backgroundVerdictPromises) {
        session.backgroundVerdictPromises = [];
    }
    
    session.backgroundVerdictPromises.push(promise);
}

function getAllBackgroundVerdictPromises() {
    if (!session || !session.backgroundVerdictPromises) {
        return [];
    }
    return session.backgroundVerdictPromises;
}

function clearBackgroundVerdictPromises() {
    if (!session) return;
    session.backgroundVerdictPromises = [];
}

