// Session Restore - Restores session from cache

function restoreSessionFromCache() {
    try {
        if (!hasCachedSession()) {
            return false;
        }
        
        const cachedData = loadSessionFromCache();
        if (!cachedData || !cachedData.session) {
            return false;
        }
        
        // Session is already restored by loadSessionFromCache()
        // Restore currentQuestion
        currentQuestion = cachedData.currentQuestion;
        
        // Restore dialog from topicStates qaList
        const dialogArea = domCache.get('dialogArea');
        if (dialogArea && session && session.topicStates) {
            dialogArea.innerHTML = '';
            session.topics.forEach((topic, index) => {
                const state = session.topicStates[index];
                if (state && state.qaList) {
                    state.qaList.forEach(qa => {
                        displayQuestion(qa.question);
                        displayAnswer(qa.answer);
                    });
                }
            });
        }
        
        // Restore UI state
        updateProgress();
        renderTopicStatus();
        
        // Show interview screen
        showScreen(cachedData.currentScreen || 'interview');
        
        // Show current question if exists
        if (currentQuestion && currentQuestion.text) {
            displayQuestion(currentQuestion.text);
        }
        
        return true;
    } catch (error) {
        console.error('Error restoring session from cache:', error);
        clearSessionCache();
        return false;
    }
}

