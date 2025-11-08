/**
 * Topic Status Component
 * 
 * Manages topic status display and progress updates.
 * 
 * @module ui/components/topic-status
 */

/**
 * Updates progress display with current topic information
 */
function updateProgress() {
    const session = getSession();
    if (!session) return;
    
    const currentTopic = getCurrentTopic();
    const totalTopics = session.topics.length;
    const currentTopicNum = session.currentTopicIndex + 1;
    
    document.getElementById('questionCount').textContent = currentTopicNum;
    document.getElementById('maxQuestions').textContent = totalTopics;
    document.getElementById('currentTopic').textContent = currentTopic ? currentTopic.name : '-';
}

/**
 * Renders topic status list
 */
function renderTopicStatus() {
    const session = getSession();
    if (!session) return;
    
    const statusList = document.getElementById('topicStatusList');
    statusList.innerHTML = '';
    
    session.topics.forEach((topic, index) => {
        const state = session.topicStates[index];
        if (!state) return;
        
        const statusColors = {
            [TOPIC_STATUS.NOT_STARTED]: 'bg-gray-200',
            [TOPIC_STATUS.PROBING]: 'bg-yellow-200',
            [TOPIC_STATUS.DONE]: 'bg-green-200'
        };
        
        const statusLabels = {
            [TOPIC_STATUS.NOT_STARTED]: 'Not Started',
            [TOPIC_STATUS.PROBING]: 'In Progress',
            [TOPIC_STATUS.DONE]: 'Complete'
        };
        
        const isCurrent = index === session.currentTopicIndex;
        const item = document.createElement('div');
        item.className = `p-2 rounded ${statusColors[state.status] || 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-indigo-500' : ''}`;
        item.innerHTML = `
            <div class="font-semibold text-sm">${escapeHtml(topic.name)}</div>
            <div class="text-xs text-gray-600">${statusLabels[state.status]} (${state.qaList.length} Q)</div>
        `;
        statusList.appendChild(item);
    });
}

