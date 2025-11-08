/**
 * Screen Management Component
 * 
 * Manages screen visibility and switching.
 * 
 * @module ui/components/screens
 */

/**
 * Shows a specific screen and hides others
 * @param {string} screenName - Screen name ('setup', 'interview', 'results')
 */
function showScreen(screenName) {
    const setupScreen = domCache.get('setupScreen');
    const interviewScreen = domCache.get('interviewScreen');
    const resultsScreen = domCache.get('resultsScreen');
    
    if (setupScreen) setupScreen.classList.add('hidden');
    if (interviewScreen) interviewScreen.classList.add('hidden');
    if (resultsScreen) resultsScreen.classList.add('hidden');
    
    const targetScreen = domCache.get(`${screenName}Screen`);
    if (targetScreen) targetScreen.classList.remove('hidden');
}

