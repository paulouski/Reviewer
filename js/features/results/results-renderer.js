/**
 * Results Renderer
 * 
 * Renders final interview results.
 * 
 * @module features/results/results-renderer
 */

/**
 * Renders final interview results
 * @param {Array<Object>} topicVerdicts - Array of topic verdicts
 * @param {Object|null} finalSummaryOutput - Final summary output (optional)
 */
function renderFinalResults(topicVerdicts, finalSummaryOutput) {
    // Show FinalSummary if available
    if (finalSummaryOutput && finalSummaryOutput.fit_overall_percent !== undefined) {
        const fitPercent = finalSummaryOutput.fit_overall_percent;
        document.getElementById('fitPercent').textContent = `${Math.round(fitPercent)}%`;
        document.getElementById('fitLabel').textContent = finalSummaryOutput.fit_label || 'Fit Score';
        
        // Update circular progress
        const circumference = 2 * Math.PI * 88; // radius = 88
        const offset = circumference - (fitPercent / 100) * circumference;
        const circle = document.getElementById('fitCircle');
        if (circle) {
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;
        }
    } else {
        // Hide overall fit if no summary
        document.getElementById('fitPercent').textContent = '-';
        document.getElementById('fitLabel').textContent = 'No Summary';
        const circle = document.getElementById('fitCircle');
        if (circle) {
            circle.style.strokeDasharray = '0 552.92';
            circle.style.strokeDashoffset = 0;
        }
    }
    
    // Per-topic breakdown - show all verdicts
    const breakdownDiv = document.getElementById('topicBreakdown');
    breakdownDiv.innerHTML = '';
    
    if (topicVerdicts && topicVerdicts.length > 0) {
        topicVerdicts.forEach(verdict => {
            const topicDiv = document.createElement('div');
            topicDiv.className = 'bg-gray-50 rounded-lg p-4 mb-3';
            
            let summaryComment = '';
            if (finalSummaryOutput && finalSummaryOutput.per_topic) {
                const summaryItem = finalSummaryOutput.per_topic.find(item => item.name === verdict.name);
                if (summaryItem) {
                    summaryComment = summaryItem.comment;
                }
            }
            
            topicDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold text-lg">${escapeHtml(verdict.name)}</span>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 rounded text-sm font-medium ${
                            verdict.assessed_level === 'deep' ? 'bg-green-100 text-green-800' :
                            verdict.assessed_level === 'solid' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }">${escapeHtml(verdict.assessed_level)}</span>
                        <span class="text-lg font-bold text-indigo-600">${verdict.score}/5</span>
                    </div>
                </div>
                ${summaryComment ? `<p class="text-sm text-gray-600 mb-2">${escapeHtml(summaryComment)}</p>` : ''}
                <div class="mt-2">
                    ${verdict.strengths && verdict.strengths.length > 0 ? `
                        <div class="mb-2">
                            <span class="text-xs font-semibold text-green-700">Strengths:</span>
                            <ul class="list-disc list-inside text-xs text-gray-700 ml-2">
                                ${verdict.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${verdict.gaps && verdict.gaps.length > 0 ? `
                        <div>
                            <span class="text-xs font-semibold text-red-700">Gaps:</span>
                            <ul class="list-disc list-inside text-xs text-gray-700 ml-2">
                                ${verdict.gaps.map(g => `<li>${escapeHtml(g)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
            breakdownDiv.appendChild(topicDiv);
        });
    }
    
    // Hide old evaluator-specific sections (strengths, weaknesses, recommendations)
    const strengthsList = document.getElementById('strengthsList');
    const weaknessesList = document.getElementById('weaknessesList');
    const recommendationsList = domCache.get('recommendationsList');
    
    if (strengthsList) {
        strengthsList.innerHTML = '';
        strengthsList.parentElement.style.display = 'none';
    }
    if (weaknessesList) {
        weaknessesList.innerHTML = '';
        weaknessesList.parentElement.style.display = 'none';
    }
    if (recommendationsList) {
        recommendationsList.innerHTML = '';
        recommendationsList.parentElement.style.display = 'none';
    }
}

