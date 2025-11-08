// Session Cache - Manages session caching in localStorage

const CACHE_KEY = 'interview_session_cache';
const CACHE_VERSION = '2.0';

function saveSessionToCache(currentQuestion, currentScreen) {
    if (!session) return;
    
    try {
        // Prepare session data without apiKey
        const sessionData = {
            topics: session.topics,
            topicStates: session.topicStates,
            currentTopicIndex: session.currentTopicIndex,
            enableFinalSummary: session.enableFinalSummary,
            maxQuestionsPerTopic: session.maxQuestionsPerTopic,
            prefetchedQuestions: session.prefetchedQuestions || {}
        };
        
        const cacheData = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            session: sessionData,
            currentQuestion: currentQuestion,
            currentScreen: currentScreen || 'interview'
        };
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error saving session to cache:', error);
    }
}

function loadSessionFromCache() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) {
            return null;
        }
        
        const cacheData = JSON.parse(cachedData);
        
        // Validate cache structure
        if (!cacheData.version || !cacheData.session) {
            console.warn('Invalid cache structure, clearing cache');
            clearSessionCache();
            return null;
        }
        
        // Validate session data structure
        const sessionData = cacheData.session;
        if (!sessionData.topics || !Array.isArray(sessionData.topics) ||
            !sessionData.topicStates || typeof sessionData.topicStates !== 'object' ||
            typeof sessionData.currentTopicIndex !== 'number') {
            console.warn('Invalid session data structure, clearing cache');
            clearSessionCache();
            return null;
        }
        
        // Restore session (apiKey will be loaded from localStorage separately)
        const apiKey = localStorage.getItem('openai_api_key') || '';
        session = {
            apiKey: apiKey,
            topics: sessionData.topics,
            topicStates: sessionData.topicStates,
            currentTopicIndex: sessionData.currentTopicIndex || 0,
            enableFinalSummary: sessionData.enableFinalSummary || false,
            maxQuestionsPerTopic: sessionData.maxQuestionsPerTopic || 5,
            prefetchedQuestions: sessionData.prefetchedQuestions || {},
            backgroundVerdictPromises: [] // Don't restore promises from cache
        };
        
        return {
            session: session,
            currentQuestion: cacheData.currentQuestion || null,
            currentScreen: cacheData.currentScreen || 'interview'
        };
    } catch (error) {
        console.error('Error loading session from cache:', error);
        clearSessionCache();
        return null;
    }
}

function clearSessionCache() {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Error clearing session cache:', error);
    }
}

function hasCachedSession() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) {
            return false;
        }
        
        const cacheData = JSON.parse(cachedData);
        return cacheData.version && cacheData.session;
    } catch (error) {
        console.error('Error checking cached session:', error);
        return false;
    }
}

