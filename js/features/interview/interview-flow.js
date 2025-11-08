/**
 * Interview Flow Logic
 * 
 * Main interview flow functions: starting, handling answers, and ending interviews.
 * 
 * @module features/interview/interview-flow
 */

/**
 * Starts a new interview session
 * - Validates inputs (API key, job description, CV)
 * - Calls Planner agent to generate topics
 * - Initializes session
 * - Gets first question from TopicAgent
 * - Displays interview screen
 * 
 * @returns {Promise<void>}
 */
async function startInterview() {
    // Prevent duplicate requests
    if (isProcessingRequest()) {
        showNotification('Please wait, processing...', 'info');
        return;
    }
    
    // Clear any existing session cache when starting new interview
    clearSessionCache();
    
    // Clear form data cache when starting new interview
    clearFormData();
    
    // Get API key from encrypted storage
    const jobDescriptionEl = domCache.get('jobDescription');
    const candidateCVEl = domCache.get('candidateCV');
    const enableFinalSummaryEl = document.getElementById('enableFinalSummary');
    
    const apiKey = getApiKey();
    const jobDescription = jobDescriptionEl ? jobDescriptionEl.value.trim() : '';
    const candidateCV = candidateCVEl ? candidateCVEl.value.trim() : '';
    const enableFinalSummary = enableFinalSummaryEl ? enableFinalSummaryEl.checked : false;
    
    // Validate API key
    if (!apiKey) {
        showNotification('API key is required', 'error');
        return;
    }
    
    const apiKeyValidation = validateApiKey(apiKey);
    if (!apiKeyValidation.valid) {
        showNotification(apiKeyValidation.error, 'error');
        return;
    }
    
    // Validate job description
    const jobDescriptionValidation = validateJobDescription(jobDescription);
    if (!jobDescriptionValidation.valid) {
        showNotification(jobDescriptionValidation.error, 'error');
        return;
    }
    
    // Validate candidate CV
    const candidateCVValidation = validateCandidateCV(candidateCV);
    if (!candidateCVValidation.valid) {
        showNotification(candidateCVValidation.error, 'error');
        return;
    }
    
    // API key should already be in encrypted storage (set via modal)
    // If not, user should be prompted to enter it via modal
    
    setProcessing(true);
    
    try {
        showLoading('Analyzing job description and CV...');
        
        // Call Planner
        const plannerOutput = await callPlanner(apiKey, jobDescription, candidateCV);
        
        // Validate planner output using schema
        const plannerValidation = validatePlannerResponse(plannerOutput);
        if (!plannerValidation.valid) {
            throw new Error(plannerValidation.error);
        }
        
        // Initialize session
        const config = getConfig();
        const maxQuestionsPerTopic = config?.settings?.maxQuestionsPerTopic || 5;
        initializeSession(
            plannerOutput.topics,
            apiKey,
            maxQuestionsPerTopic,
            enableFinalSummary
        );
        
        // Get first question for first topic
        const firstTopic = getCurrentTopic();
        if (!firstTopic) {
            throw new Error('No topics found in plan');
        }
        
        showLoading('Generating first question...');
        const topicState = getCurrentTopicState();
        const session = getSession();
        const topicAgentOutput = await callTopicAgent(
            apiKey,
            firstTopic.name,
            firstTopic.required_level,
            maxQuestionsPerTopic,
            topicState.qaList,
            null // No previous answer yet
        );
        
        // Validate topicAgent output
        const topicAgentValidation = validateTopicAgentAsk(topicAgentOutput);
        if (!topicAgentValidation.valid) {
            throw new Error(topicAgentValidation.error);
        }
        
        setCurrentQuestion({
            text: topicAgentOutput.question.text,
            topicIndex: session.currentTopicIndex
        });
        
        // Save session to cache with current question
        saveSessionToCache(getCurrentQuestion(), 'interview');
        
        hideLoading();
        showScreen('interview');
        displayQuestion(getCurrentQuestion().text);
        updateProgress();
        renderTopicStatus();
        
        // Prefetch next topic question in background
        prefetchNextTopicQuestion();
        
    } catch (error) {
        hideLoading();
        console.error('Error starting interview:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        setProcessing(false);
    }
}

/**
 * Handles answer submission
 * - Validates answer
 * - Adds Q&A to current topic
 * - Determines next action (continue topic, move to next topic, or end interview)
 * - Handles prefetched questions
 * - Manages background verdict fetching
 * 
 * @returns {Promise<void>}
 */
async function handleAnswerSubmit() {
    // Prevent duplicate requests
    if (isProcessingRequest()) {
        showNotification('Please wait, processing your answer...', 'info');
        return;
    }
    
    const answerInput = domCache.get('answerInput');
    if (!answerInput) return;
    
    const answer = answerInput.value.trim();
    
    // Validate answer
    const answerValidation = validateAnswer(answer);
    if (!answerValidation.valid) {
        showNotification(answerValidation.error, 'error');
        return;
    }
    
    const session = getSession();
    const currentQuestion = getCurrentQuestion();
    
    if (!session || !currentQuestion) {
        showNotification('Session not initialized', 'error');
        return;
    }
    
    setProcessing(true);
    
    try {
        displayAnswer(answer);
        answerInput.value = '';
        showLoading('Processing your answer...');
        
        const currentTopic = getCurrentTopic();
        const topicState = getCurrentTopicState();
        
        if (!currentTopic || !topicState) {
            throw new Error('Current topic not found');
        }
        
        // Add Q&A to current topic
        addQaToCurrentTopic(currentQuestion.text, answer);
        
        // Check if we should continue with this topic
        const shouldContinue = shouldContinueCurrentTopic();
        
        if (!shouldContinue) {
            if (hasMoreTopics()) {
                const nextTopicIndex = session.currentTopicIndex + 1;
                const nextTopic = session.topics[nextTopicIndex];
                const nextTopicState = session.topicStates[nextTopicIndex];
                
                // Check if we have prefetched question
                const prefetched = getPrefetchedQuestion(nextTopicIndex);
                
                if (prefetched) {
                    // Prefetched question available - show immediately, fetch verdict in background
                    const nextTopicAgentOutput = prefetched.topicAgentOutput;
                    
                    // Validate prefetched question
                    if (!nextTopicAgentOutput || nextTopicAgentOutput.status !== AGENT_STATUS.ASK || !nextTopicAgentOutput.question || !nextTopicAgentOutput.question.text) {
                        throw new Error('Prefetched question is invalid');
                    }
                    
                    // Capture current topic index before moving
                    const currentTopicIndex = session.currentTopicIndex;
                    
                    // Clear prefetched question
                    clearPrefetchedQuestion(nextTopicIndex);
                    
                    // Move to next topic
                    moveToNextTopic();
                    
                    setCurrentQuestion({
                        text: nextTopicAgentOutput.question.text,
                        topicIndex: session.currentTopicIndex
                    });
                    
                    saveSessionToCache(getCurrentQuestion(), 'interview');
                    hideLoading();
                    displayQuestion(getCurrentQuestion().text);
                    updateProgress();
                    renderTopicStatus();
                    
                    // Fetch verdict in background (don't await)
                    const verdictPromise = callTopicAgent(
                        session.apiKey,
                        currentTopic.name,
                        currentTopic.required_level,
                        session.maxQuestionsPerTopic,
                        topicState.qaList,
                        answer
                    ).then(topicAgentOutput => {
                        // Validate and store verdict
                        if (topicAgentOutput) {
                            const topicAgentValidation = validateTopicAgentFinal(topicAgentOutput);
                            if (topicAgentValidation.valid) {
                                // Set verdict for the topic we just left (using captured index)
                                const session = getSession();
                                if (currentTopicIndex >= 0 && session.topicStates[currentTopicIndex]) {
                                    session.topicStates[currentTopicIndex].verdict = topicAgentOutput.verdict;
                                    session.topicStates[currentTopicIndex].status = TOPIC_STATUS.DONE;
                                    saveSessionToCache(null, 'interview');
                                    renderTopicStatus(); // Update UI
                                }
                            }
                        }
                    }).catch(error => {
                        console.error('Error fetching background verdict:', error);
                        // Don't throw - this is background operation
                    });
                    
                    // Track background verdict promise
                    addBackgroundVerdictPromise(verdictPromise);
                    
                    // Prefetch next topic question (+1) in background
                    prefetchNextTopicQuestion();
                    return;
                } else {
                    // No prefetched question - fetch both verdict and next question in parallel
                    showLoading('Evaluating topic...');
                    
                    // Prepare promises for parallel execution
                    const verdictPromise = callTopicAgent(
                        session.apiKey,
                        currentTopic.name,
                        currentTopic.required_level,
                        session.maxQuestionsPerTopic,
                        topicState.qaList,
                        answer
                    );
                    
                    const nextQuestionPromise = callTopicAgent(
                        session.apiKey,
                        nextTopic.name,
                        nextTopic.required_level,
                        session.maxQuestionsPerTopic,
                        nextTopicState.qaList,
                        null
                    );
                    
                    // Execute both requests in parallel
                    const [topicAgentOutput, nextTopicAgentOutput] = await Promise.all([
                        verdictPromise,
                        nextQuestionPromise
                    ]);
                    
                    // Validate topicAgent output (verdict)
                    const topicAgentValidation = validateTopicAgentFinal(topicAgentOutput);
                    if (!topicAgentValidation.valid) {
                        throw new Error(topicAgentValidation.error);
                    }
                    setCurrentTopicVerdict(topicAgentOutput.verdict);
                    
                    // Validate next topicAgent output
                    const nextTopicAgentValidation = validateTopicAgentAsk(nextTopicAgentOutput);
                    if (!nextTopicAgentValidation.valid) {
                        throw new Error(nextTopicAgentValidation.error);
                    }
                    
                    // Move to next topic
                    moveToNextTopic();
                    
                    setCurrentQuestion({
                        text: nextTopicAgentOutput.question.text,
                        topicIndex: session.currentTopicIndex
                    });
                    
                    saveSessionToCache(getCurrentQuestion(), 'interview');
                    hideLoading();
                    displayQuestion(getCurrentQuestion().text);
                    updateProgress();
                    renderTopicStatus();
                    
                    // Prefetch next topic question (+1) in background
                    prefetchNextTopicQuestion();
                    return;
                }
            } else {
                // No more topics - just get verdict
                const topicAgentOutput = await callTopicAgent(
                    session.apiKey,
                    currentTopic.name,
                    currentTopic.required_level,
                    session.maxQuestionsPerTopic,
                    topicState.qaList,
                    answer
                );
                
                // Validate topicAgent output
                const topicAgentValidation = validateTopicAgentFinal(topicAgentOutput);
                if (!topicAgentValidation.valid) {
                    throw new Error(topicAgentValidation.error);
                }
                setCurrentTopicVerdict(topicAgentOutput.verdict);
                
                // No more topics, end interview
                hideLoading();
                await endInterview();
                return;
            }
        } else {
            // Continue with current topic - get next question
            showLoading('Generating next question...');
            const topicAgentOutput = await callTopicAgent(
                session.apiKey,
                currentTopic.name,
                currentTopic.required_level,
                session.maxQuestionsPerTopic,
                topicState.qaList,
                answer
            );
            
            // Validate topicAgent output
            const topicAgentValidation = validateTopicAgentResponse(topicAgentOutput);
            if (!topicAgentValidation.valid) {
                throw new Error(topicAgentValidation.error);
            }
            
            if (topicAgentOutput.status === AGENT_STATUS.FINAL && topicAgentOutput.verdict) {
                // Agent decided to finalize early
                setCurrentTopicVerdict(topicAgentOutput.verdict);
                
                // Move to next topic or end interview
                if (hasMoreTopics()) {
                    const nextTopicIndex = session.currentTopicIndex + 1;
                    const nextTopic = session.topics[nextTopicIndex];
                    const nextTopicState = session.topicStates[nextTopicIndex];
                    
                    // Check if we have prefetched question
                    const prefetched = getPrefetchedQuestion(nextTopicIndex);
                    
                    let nextTopicAgentOutput;
                    if (prefetched) {
                        // Use prefetched question - show immediately without loading
                        nextTopicAgentOutput = prefetched.topicAgentOutput;
                        clearPrefetchedQuestion(nextTopicIndex);
                    } else {
                        // Fetch question normally - show loading
                        showLoading('Generating next question...');
                        nextTopicAgentOutput = await callTopicAgent(
                            session.apiKey,
                            nextTopic.name,
                            nextTopic.required_level,
                            session.maxQuestionsPerTopic,
                            nextTopicState.qaList,
                            null
                        );
                    }
                    
                    if (!nextTopicAgentOutput || nextTopicAgentOutput.status !== AGENT_STATUS.ASK || !nextTopicAgentOutput.question || !nextTopicAgentOutput.question.text) {
                        throw new Error('TopicAgent did not return a question');
                    }
                    
                    moveToNextTopic();
                    
                    setCurrentQuestion({
                        text: nextTopicAgentOutput.question.text,
                        topicIndex: session.currentTopicIndex
                    });
                    
                    saveSessionToCache(getCurrentQuestion(), 'interview');
                    hideLoading();
                    displayQuestion(getCurrentQuestion().text);
                    updateProgress();
                    renderTopicStatus();
                    
                    // Prefetch next topic question (+1) in background
                    prefetchNextTopicQuestion();
                    return;
                } else {
                    hideLoading();
                    await endInterview();
                    return;
                }
            } else if (topicAgentOutput.status === AGENT_STATUS.ASK && topicAgentOutput.question && topicAgentOutput.question.text) {
                // Continue asking questions
                setCurrentQuestion({
                    text: topicAgentOutput.question.text,
                    topicIndex: session.currentTopicIndex
                });
                
                saveSessionToCache(getCurrentQuestion(), 'interview');
                hideLoading();
                displayQuestion(getCurrentQuestion().text);
                updateProgress();
                renderTopicStatus();
                
                // Prefetch next topic question if we're on penultimate question
                if (topicState.qaList.length === session.maxQuestionsPerTopic - 1 && hasMoreTopics()) {
                    prefetchNextTopicQuestion();
                }
            } else {
                throw new Error('TopicAgent returned invalid response');
            }
        }
        
    } catch (error) {
        hideLoading();
        handleError(error, 'handleAnswerSubmit', ErrorType.API);
    } finally {
        setProcessing(false);
    }
}

/**
 * Ends the interview session
 * - Waits for background verdict promises
 * - Gets final verdicts for incomplete topics
 * - Optionally calls FinalSummary agent
 * - Renders final results
 * - Clears session cache
 * 
 * @returns {Promise<void>}
 */
async function endInterview() {
    const session = getSession();
    if (!session) return;
    
    setProcessing(true);
    
    try {
        // Wait for any background verdict promises to complete
        const backgroundPromises = getAllBackgroundVerdictPromises();
        if (backgroundPromises.length > 0) {
            showLoading('Finalizing topics...');
            try {
                await Promise.all(backgroundPromises);
            } catch (error) {
                console.error('Error waiting for background verdicts:', error);
                // Continue anyway - some verdicts may have failed
            }
        }
        
        // First, get final verdicts for any incomplete topics
        const incompleteTopics = getIncompleteTopics();
        
        if (incompleteTopics.length > 0) {
            showLoading('Finalizing incomplete topics...');
            
            for (const incomplete of incompleteTopics) {
                const topicState = incomplete.state;
                if (topicState.qaList.length > 0) {
                    // Request final verdict for this incomplete topic
                    const topicAgentOutput = await callTopicAgent(
                        session.apiKey,
                        incomplete.topic.name,
                        incomplete.topic.required_level,
                        session.maxQuestionsPerTopic,
                        topicState.qaList,
                        topicState.qaList[topicState.qaList.length - 1]?.answer || null
                    );
                    
                    if (topicAgentOutput && topicAgentOutput.status === AGENT_STATUS.FINAL && topicAgentOutput.verdict) {
                        session.topicStates[incomplete.index].verdict = topicAgentOutput.verdict;
                        session.topicStates[incomplete.index].status = TOPIC_STATUS.DONE;
                    }
                }
            }
        }
        
        // Clear background verdict promises
        clearBackgroundVerdictPromises();
        
        // Collect all verdicts
        const allVerdicts = getAllTopicVerdicts();
        
        // Optionally call FinalSummary if enabled
        let finalSummaryOutput = null;
        if (session.enableFinalSummary && allVerdicts.length > 0) {
            showLoading('Generating final summary...');
            try {
                finalSummaryOutput = await callFinalSummary(session.apiKey, allVerdicts);
                
                // Validate finalSummary output
                if (finalSummaryOutput) {
                    const finalSummaryValidation = validateFinalSummaryResponse(finalSummaryOutput);
                    if (!finalSummaryValidation.valid) {
                        console.warn('FinalSummary validation failed:', finalSummaryValidation.error);
                        finalSummaryOutput = null;
                    }
                }
            } catch (error) {
                console.error('Error calling FinalSummary:', error);
                // Continue without final summary
                finalSummaryOutput = null;
            }
        }
        
        hideLoading();
        renderFinalResults(allVerdicts, finalSummaryOutput);
        showScreen('results');
        
        // Clear session cache when interview ends
        clearSessionCache();
        
    } catch (error) {
        hideLoading();
        handleError(error, 'endInterview', ErrorType.API);
    } finally {
        setProcessing(false);
    }
}

