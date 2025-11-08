/**
 * Dialog Component
 * 
 * Manages dialog display (questions and answers).
 * 
 * @module ui/components/dialog
 */

/**
 * Displays a question in the dialog area
 * @param {string} questionText - Question text to display
 */
function displayQuestion(questionText) {
    const dialogArea = domCache.get('dialogArea');
    if (!dialogArea) return;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'flex justify-start';
    questionDiv.innerHTML = `
        <div class="bg-indigo-100 rounded-lg px-4 py-2 max-w-3xl">
            <div class="text-sm font-semibold text-indigo-800 mb-1">Interviewer</div>
            <div class="text-gray-800">${escapeHtml(questionText)}</div>
        </div>
    `;
    dialogArea.appendChild(questionDiv);
    dialogArea.scrollTop = dialogArea.scrollHeight;
}

/**
 * Displays an answer in the dialog area
 * @param {string} answerText - Answer text to display
 */
function displayAnswer(answerText) {
    const dialogArea = domCache.get('dialogArea');
    if (!dialogArea) return;
    
    const answerDiv = document.createElement('div');
    answerDiv.className = 'flex justify-end';
    answerDiv.innerHTML = `
        <div class="bg-gray-200 rounded-lg px-4 py-2 max-w-3xl">
            <div class="text-sm font-semibold text-gray-700 mb-1">You</div>
            <div class="text-gray-800">${escapeHtml(answerText)}</div>
        </div>
    `;
    dialogArea.appendChild(answerDiv);
    dialogArea.scrollTop = dialogArea.scrollHeight;
}

