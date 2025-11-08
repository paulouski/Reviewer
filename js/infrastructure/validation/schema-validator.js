/**
 * Schema Validator
 * 
 * Validates agent responses against JSON schemas.
 * 
 * @module infrastructure/validation/schema-validator
 */

/**
 * Validates a response against a schema for a specific role
 * @param {string} roleName - Role name (e.g., 'planner', 'topicAgent')
 * @param {Object} response - Response object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
function validateResponse(roleName, response) {
    const schemas = getSchemas();
    if (!schemas || !schemas[roleName]) {
        console.warn(`Schema not found for role: ${roleName}`);
        return { valid: true, errors: [] }; // Don't fail if schema not loaded
    }
    
    const schema = schemas[roleName];
    const errors = [];
    
    // Check required fields
    if (schema.required) {
        schema.required.forEach(fieldName => {
            const fieldDef = schema.properties?.[fieldName];
            const isNullable = Array.isArray(fieldDef?.type) && fieldDef.type.includes('null');
            
            // Field must be present (not undefined), but can be null if nullable
            if (response[fieldName] === undefined) {
                errors.push(`Missing required field: ${fieldName}`);
            } else if (response[fieldName] === null && !isNullable) {
                // Null is only allowed for nullable fields
                errors.push(`Field ${fieldName} cannot be null (not nullable)`);
            }
        });
    }
    
    // Validate each field
    function validateField(fieldName, value, fieldDef, path = '', parentRequired = []) {
        const fullPath = path ? `${path}.${fieldName}` : fieldName;
        const isRequired = parentRequired.includes(fieldName);
        
        // Handle nullable types (type can be array like ["string", "null"])
        const fieldType = Array.isArray(fieldDef.type) ? fieldDef.type[0] : fieldDef.type;
        const isNullable = Array.isArray(fieldDef.type) && fieldDef.type.includes('null');
        
        // Allow null for nullable fields, but still require the field to be present if required
        if (value === null && isNullable) {
            return; // Null is valid for nullable fields
        }
        
        if (value === undefined || value === null) {
            if (isRequired) {
                errors.push(`Missing required field: ${fullPath}`);
            }
            return;
        }
        
        // Type validation
        if (fieldDef.type === 'array' || fieldType === 'array') {
            if (!Array.isArray(value)) {
                errors.push(`Field ${fullPath} must be an array, got ${typeof value}`);
                return;
            }
            
            // Validate array length constraints
            if (fieldDef.minItems !== undefined && value.length < fieldDef.minItems) {
                errors.push(`Field ${fullPath} must have at least ${fieldDef.minItems} items, got ${value.length}`);
            }
            if (fieldDef.maxItems !== undefined && value.length > fieldDef.maxItems) {
                errors.push(`Field ${fullPath} must have at most ${fieldDef.maxItems} items, got ${value.length}`);
            }
            
            if (fieldDef.items) {
                const itemType = Array.isArray(fieldDef.items.type) ? fieldDef.items.type[0] : fieldDef.items.type;
                value.forEach((item, index) => {
                    if (itemType === 'object' && fieldDef.items.properties) {
                        const nestedRequired = fieldDef.items.required || [];
                        Object.keys(fieldDef.items.properties).forEach(key => {
                            validateField(key, item[key], fieldDef.items.properties[key], `${fullPath}[${index}]`, nestedRequired);
                        });
                    } else if (itemType && typeof item !== itemType) {
                        errors.push(`Field ${fullPath}[${index}] must be ${itemType}, got ${typeof item}`);
                    }
                });
            }
        } else if (fieldDef.type === 'object' || fieldType === 'object') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                errors.push(`Field ${fullPath} must be an object, got ${typeof value}`);
                return;
            }
            if (fieldDef.properties) {
                const nestedRequired = fieldDef.required || [];
                Object.keys(fieldDef.properties).forEach(key => {
                    validateField(key, value[key], fieldDef.properties[key], fullPath, nestedRequired);
                });
            }
        } else {
            // Handle integer type specially (typeof returns 'number' for integers in JS)
            if (fieldType === 'integer') {
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    errors.push(`Field ${fullPath} must be an integer, got ${typeof value}`);
                    return;
                }
            } else if (fieldType === 'number') {
                if (typeof value !== 'number') {
                    errors.push(`Field ${fullPath} must be a number, got ${typeof value}`);
                    return;
                }
            } else if (typeof value !== fieldType) {
                errors.push(`Field ${fullPath} must be ${fieldType}, got ${typeof value}`);
                return;
            }
        }
        
        // Validation rules (integer check already done above)
        
        if (fieldDef.minimum !== undefined && value < fieldDef.minimum) {
            errors.push(`Field ${fullPath} must be >= ${fieldDef.minimum}, got ${value}`);
        }
        
        if (fieldDef.maximum !== undefined && value > fieldDef.maximum) {
            errors.push(`Field ${fullPath} must be <= ${fieldDef.maximum}, got ${value}`);
        }
        
        if (fieldDef.minLength !== undefined && value.length < fieldDef.minLength) {
            errors.push(`Field ${fullPath} must have length >= ${fieldDef.minLength}, got ${value.length}`);
        }
        
        if (fieldDef.maxLength !== undefined && value.length > fieldDef.maxLength) {
            errors.push(`Field ${fullPath} must have length <= ${fieldDef.maxLength}, got ${value.length}`);
        }
        
        if (fieldDef.enum && !fieldDef.enum.includes(value)) {
            errors.push(`Field ${fullPath} must be one of [${fieldDef.enum.join(', ')}], got ${value}`);
        }
        
        if (fieldDef.pattern && !new RegExp(fieldDef.pattern).test(value)) {
            errors.push(`Field ${fullPath} does not match pattern ${fieldDef.pattern}`);
        }
    }
    
    const topLevelRequired = schema.required || [];
    Object.keys(schema.properties || {}).forEach(key => {
        validateField(key, response[key], schema.properties[key], '', topLevelRequired);
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Gets schema fields for a role
 * @param {string} roleName - Role name
 * @returns {Object|null} Schema properties or null
 */
function getSchemaFields(roleName) {
    const schemas = getSchemas();
    if (!schemas || !schemas[roleName]) {
        return null;
    }
    return schemas[roleName].properties || null;
}

/**
 * Gets required fields for a role schema
 * @param {string} roleName - Role name
 * @returns {string[]} Array of required field names
 */
function getSchemaRequired(roleName) {
    const schemas = getSchemas();
    if (!schemas || !schemas[roleName]) {
        return [];
    }
    return schemas[roleName].required || [];
}

