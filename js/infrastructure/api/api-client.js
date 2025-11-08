/**
 * API Client
 * 
 * Base API client for OpenAI Responses API with JSON schema support.
 * 
 * @module infrastructure/api/api-client
 */

/**
 * Cleans prompt text by removing excessive newlines
 * Replaces multiple consecutive newlines with single newline
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanPromptText(text) {
    // Replace multiple consecutive newlines with single newline
    text = text.replace(/\n{2,}/g, '\n');
    // Trim whitespace from each line and the whole text
    text = text.split('\n').map(line => line.trim()).join('\n').trim();
    return text;
}

/**
 * Calls OpenAI Responses API
 * @param {string} roleName - Role name (used for schema selection)
 * @param {string} apiKey - OpenAI API key
 * @param {Array<{role: string, content: string}>} messages - Array of messages
 * @param {string} model - Model name
 * @param {boolean} useJsonSchema - Whether to use JSON schema mode
 * @param {number} maxOutputTokens - Maximum output tokens
 * @param {string} reasoningEffort - Reasoning effort: 'low' | 'medium' | 'high'
 * @returns {Promise<Object|string>} Parsed JSON object if useJsonSchema, otherwise text string
 * @throws {Error} If API request fails
 */
async function callOpenAI(roleName, apiKey, messages, model, useJsonSchema = true, maxOutputTokens = 1000, reasoningEffort = 'medium') {
    // Log API call without sensitive message content
    console.group(`🤖 API Call: ${roleName}`);
    console.log(`Model: ${model}, Messages count: ${messages.length}`);
    
    try {
        // Convert messages format to Responses API input format
        const input = messages.map(msg => ({
            role: msg.role,
            content: [
                {
                    type: "input_text",
                    text: cleanPromptText(msg.content)
                }
            ]
        }));
        
        // Build request body
        const requestBody = {
            model: model,
            input: input,
            max_output_tokens: maxOutputTokens,
            reasoning: { effort: reasoningEffort }
        };
        
        // Add Structured Outputs (Responses API) for JSON schema mode
        if (useJsonSchema) {
            // Use roleName as-is (camelCase) to match schema keys
            const jsonSchema = convertToOpenAIJsonSchema(roleName);
            if (jsonSchema) {
                requestBody.text = {
                    format: {
                        type: "json_schema",
                        name: `${roleName}Response`,
                        schema: jsonSchema,
                        strict: true
                    }
                };
            } else {
                console.warn('JSON schema not found, falling back to text mode');
            }
        }
        
        // Prepare request options
        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        };
        
        const apiUrl = 'https://api.openai.com/v1/responses';
        
        const response = await fetchWithRetry(apiUrl, requestOptions);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (parseError) {
                // If response is not JSON, create error from status text
                console.error('API Error: Failed to parse error response as JSON');
                console.groupEnd();
                const error = new Error(`API Error: ${response.statusText || `HTTP ${response.status}`}`);
                error.status = response.status;
                throw error;
            }
            
            console.error('API Error:', errorData);
            console.groupEnd();
            
            // Safely extract error message from various error response formats
            const errorMessage = errorData?.error?.message || 
                                errorData?.message || 
                                errorData?.error || 
                                response.statusText || 
                                `HTTP ${response.status}`;
            const error = new Error(`API Error: ${errorMessage}`);
            error.status = response.status;
            throw error;
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
            console.error('API returned empty or invalid output array:', data);
            console.groupEnd();
            throw new Error('API returned empty response');
        }
        
        // Find the output element with status "completed"
        // The actual response is only in the element where status === "completed"
        const messageOutput = data.output.find(item => item.status === 'completed');
        
        if (!messageOutput) {
            console.error('API response missing element with status "completed":', data);
            console.groupEnd();
            throw new Error('API response missing element with status "completed"');
        }
        
        if (!messageOutput.content || !Array.isArray(messageOutput.content) || messageOutput.content.length === 0) {
            console.error('API response missing content:', data);
            console.groupEnd();
            throw new Error('API response missing content');
        }
        
        // Get first content item
        const contentItem = messageOutput.content[0];
        
        if (!contentItem || !contentItem.text) {
            console.error('API response missing text in content item:', data);
            console.groupEnd();
            throw new Error('API response missing text in content item');
        }
        
        if (useJsonSchema) {
            // JSON schema mode - parsed object is available
            if (contentItem.parsed) {
                const parsed = contentItem.parsed;
                console.log('Parsed JSON:', parsed);
                console.groupEnd();
                return parsed;
            }
            
            // Fallback: try to parse text if parsed is not available
            try {
                const parsed = JSON.parse(contentItem.text);
                console.log('Parsed JSON from text:', parsed);
                console.groupEnd();
                return parsed;
            } catch (parseError) {
                console.error('API response missing parsed content and failed to parse text:', data);
                console.groupEnd();
                throw new Error('API response missing parsed content');
            }
        } else {
            // Text mode - get text content
            const text = contentItem.text;
            console.log('Text Content:', text);
            console.groupEnd();
            return text;
        }
    } catch (error) {
        console.error('Request failed:', error);
        console.groupEnd();
        
        // Re-throw with network error type if it's a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            const networkError = new Error('Network request failed');
            networkError.originalError = error;
            throw networkError;
        }
        
        throw error;
    }
}

