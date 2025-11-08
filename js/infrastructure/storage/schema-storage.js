/**
 * Schema Storage
 * 
 * Manages schema storage in localStorage and provides schema retrieval.
 * 
 * @module infrastructure/storage/schema-storage
 */

// localStorage key for schemas
const SCHEMA_STORAGE_KEY = 'interview_schemas';
const SCHEMA_VERSION = '1.0';

/**
 * Gets schemas from localStorage or returns embedded schemas as fallback
 * @returns {Object} Schemas object
 */
function getSchemas() {
    try {
        const savedSchemas = localStorage.getItem(SCHEMA_STORAGE_KEY);
        if (savedSchemas) {
            const parsed = JSON.parse(savedSchemas);
            if (parsed.version && parsed.data) {
                return parsed.data;
            }
        }
    } catch (error) {
        console.warn('Error reading schemas from localStorage:', error);
    }
    
    // Return embedded schemas as fallback
    return EMBEDDED_SCHEMAS;
}

/**
 * Loads schemas from localStorage or initializes with embedded schemas
 * @returns {Promise<Object>} Schemas object
 */
async function loadSchemas() {
    // Check if localStorage has schemas
    const savedSchemas = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (savedSchemas) {
        return getSchemas();
    }
    
    // Initialize localStorage with embedded schemas
    saveSchemas(EMBEDDED_SCHEMAS);
    return EMBEDDED_SCHEMAS;
}

/**
 * Saves schemas to localStorage
 * @param {Object} schemasData - Schemas data to save
 */
function saveSchemas(schemasData) {
    if (!schemasData) return;
    
    try {
        const schemaData = {
            version: SCHEMA_VERSION,
            timestamp: Date.now(),
            data: schemasData
        };
        
        localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schemaData));
    } catch (error) {
        console.error('Error saving schemas to localStorage:', error);
    }
}

/**
 * Resets schemas to default embedded values
 */
function resetSchemasToDefault() {
    const defaultSchemas = JSON.parse(JSON.stringify(EMBEDDED_SCHEMAS));
    saveSchemas(defaultSchemas);
}

/**
 * Updates the maxItems property for planner topics schema
 * @param {number} maxTopics - Maximum number of topics
 * @returns {boolean} True if update was successful
 */
function updatePlannerMaxTopics(maxTopics) {
    const schemas = getSchemas();
    if (!schemas || !schemas[ROLE_NAMES.PLANNER]) {
        console.warn('Schemas not loaded, cannot update maxTopics');
        return false;
    }
    
    // Create a deep copy to avoid mutating the original
    const schemasCopy = JSON.parse(JSON.stringify(schemas));
    const topicsProperty = schemasCopy[ROLE_NAMES.PLANNER].properties?.topics;
    if (topicsProperty) {
        topicsProperty.maxItems = maxTopics;
        saveSchemas(schemasCopy); // Save modified schemas
        return true;
    }
    
    return false;
}

