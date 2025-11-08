// DOM Cache - Cache frequently accessed DOM elements

const domCache = {
    // Screen elements
    setupScreen: null,
    interviewScreen: null,
    resultsScreen: null,
    
    // Loading overlay
    loadingOverlay: null,
    loadingText: null,
    
    // Setup form elements
    apiKey: null,
    jobDescription: null,
    candidateCV: null,
    
    // Interview screen elements
    dialogArea: null,
    answerInput: null,
    questionCount: null,
    maxQuestions: null,
    currentTopic: null,
    topicStatusList: null,
    
    // Results screen elements
    fitPercent: null,
    fitLabel: null,
    fitCircle: null,
    topicBreakdown: null,
    strengthsList: null,
    weaknessesList: null,
    recommendationsList: null,
    
    // API Key modal elements
    apiKeyModal: null,
    apiKeyInput: null,
    apiKeyError: null,
    
    // Config modal elements
    configModal: null,
    
    /**
     * Initialize DOM cache by querying all elements
     */
    init() {
        // Screens
        this.setupScreen = document.getElementById('setupScreen');
        this.interviewScreen = document.getElementById('interviewScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        
        // Setup form
        this.apiKey = document.getElementById('apiKey');
        this.jobDescription = document.getElementById('jobDescription');
        this.candidateCV = document.getElementById('candidateCV');
        
        // Interview screen
        this.dialogArea = document.getElementById('dialogArea');
        this.answerInput = document.getElementById('answerInput');
        this.questionCount = document.getElementById('questionCount');
        this.maxQuestions = document.getElementById('maxQuestions');
        this.currentTopic = document.getElementById('currentTopic');
        this.topicStatusList = document.getElementById('topicStatusList');
        
        // Results screen
        this.fitPercent = document.getElementById('fitPercent');
        this.fitLabel = document.getElementById('fitLabel');
        this.fitCircle = document.getElementById('fitCircle');
        this.topicBreakdown = document.getElementById('topicBreakdown');
        this.strengthsList = document.getElementById('strengthsList');
        this.weaknessesList = document.getElementById('weaknessesList');
        this.recommendationsList = document.getElementById('recommendationsList');
        
        // Modals
        this.apiKeyModal = document.getElementById('apiKeyModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.apiKeyError = document.getElementById('apiKeyError');
        this.configModal = document.getElementById('configModal');
    },
    
    /**
     * Get cached element or query if not cached
     * @param {string} key - Key in cache object
     * @returns {HTMLElement|null} Cached element
     */
    get(key) {
        if (!this[key]) {
            // Try to get element by ID matching the key
            const element = document.getElementById(key);
            if (element) {
                this[key] = element;
            }
        }
        return this[key] || null;
    }
};

// Initialize cache when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => domCache.init());
} else {
    domCache.init();
}

