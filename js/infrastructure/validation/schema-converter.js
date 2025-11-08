/**
 * Schema Converter
 * 
 * Converts schemas between different formats (OpenAI JSON Schema, prompt format).
 * 
 * @module infrastructure/validation/schema-converter
 */

/**
 * Formats a schema for display in prompts
 * @param {string} roleName - Role name
 * @returns {string} Formatted schema string
 */
function formatSchemaForPrompt(roleName) {
    const schemas = getSchemas();
    if (!schemas || !schemas[roleName]) {
        console.warn(`Schema not found for role: ${roleName}`);
        return '';
    }
    
    const schema = schemas[roleName];
    const lines = [];
    
    function formatField(fieldName, fieldDef, indent = 0, parentRequired = []) {
        const prefix = '  '.repeat(indent);
        const isRequired = parentRequired.includes(fieldName);
        const required = isRequired ? ' (required)' : ' (optional)';
        const desc = fieldDef.description ? ` // ${fieldDef.description}` : '';
        
        // Handle type (can be string or array for nullable types)
        let typeStr = Array.isArray(fieldDef.type) ? fieldDef.type[0] : fieldDef.type;
        const isNullable = Array.isArray(fieldDef.type) && fieldDef.type.includes('null');
        
        if (fieldDef.type === 'array' || typeStr === 'array') {
            const itemType = fieldDef.items?.type;
            const itemTypeStr = Array.isArray(itemType) ? itemType[0] : itemType;
            typeStr = itemTypeStr ? `${itemTypeStr}[]` : 'any[]';
        }
        
        if (fieldDef.type === 'object' || typeStr === 'object') {
            if (fieldDef.properties) {
                lines.push(`${prefix}"${fieldName}": {${required}${desc}`);
                const nestedRequired = fieldDef.required || [];
                Object.keys(fieldDef.properties).forEach(key => {
                    formatField(key, fieldDef.properties[key], indent + 1, nestedRequired);
                });
                lines.push(`${prefix}}`);
            } else {
                lines.push(`${prefix}"${fieldName}": object${required}${desc}`);
            }
        } else if (fieldDef.type === 'array' || typeStr === 'array') {
            if (fieldDef.items && fieldDef.items.type === 'object' && fieldDef.items.properties) {
                lines.push(`${prefix}"${fieldName}": [${required}${desc}`);
                lines.push(`${prefix}  {`);
                const nestedRequired = fieldDef.items.required || [];
                Object.keys(fieldDef.items.properties).forEach(key => {
                    formatField(key, fieldDef.items.properties[key], indent + 2, nestedRequired);
                });
                lines.push(`${prefix}  }`);
                lines.push(`${prefix}]`);
            } else {
                lines.push(`${prefix}"${fieldName}": ${typeStr}${required}${desc}`);
            }
        } else {
            let validation = '';
            const validations = [];
            
            if (fieldDef.minimum !== undefined) validations.push(`min: ${fieldDef.minimum}`);
            if (fieldDef.maximum !== undefined) validations.push(`max: ${fieldDef.maximum}`);
            if (fieldDef.minLength !== undefined) validations.push(`minLength: ${fieldDef.minLength}`);
            if (fieldDef.maxLength !== undefined) validations.push(`maxLength: ${fieldDef.maxLength}`);
            if (fieldDef.minItems !== undefined) validations.push(`minItems: ${fieldDef.minItems}`);
            if (fieldDef.maxItems !== undefined) validations.push(`maxItems: ${fieldDef.maxItems}`);
            if (fieldDef.enum) validations.push(`enum: [${fieldDef.enum.join(', ')}]`);
            
            if (validations.length > 0) {
                validation = ` (${validations.join(', ')})`;
            }
            
            if (isNullable) {
                typeStr += ' | null';
            }
            
            lines.push(`${prefix}"${fieldName}": ${typeStr}${required}${validation}${desc}`);
        }
    }
    
    lines.push('{');
    const topLevelRequired = schema.required || [];
    Object.keys(schema.properties || {}).forEach(key => {
        formatField(key, schema.properties[key], 1, topLevelRequired);
    });
    lines.push('}');
    
    return lines.join('\n');
}

/**
 * Converts a schema to OpenAI JSON Schema format
 * @param {string} roleName - Role name
 * @returns {Object|null} OpenAI JSON Schema object or null
 */
function convertToOpenAIJsonSchema(roleName) {
    const schemas = getSchemas();
    if (!schemas || !schemas[roleName]) {
        console.warn(`Schema not found for role: ${roleName}`);
        return null;
    }
    
    const schema = schemas[roleName];
    
    // Schema is already in JSON Schema format, but we need to ensure it's compatible with OpenAI
    // OpenAI Responses API expects specific format, so we'll return it as-is since it's already valid JSON Schema
    const jsonSchema = {
        type: "object",
        properties: {},
        required: schema.required || [],
        additionalProperties: schema.additionalProperties !== undefined ? schema.additionalProperties : false
    };
    
    function convertField(fieldDef) {
        // If fieldDef is already in JSON Schema format, copy it with adjustments
        const field = {};
        
        // Handle type (can be string or array for nullable types)
        if (Array.isArray(fieldDef.type)) {
            field.type = fieldDef.type;
        } else {
            field.type = fieldDef.type;
        }
        
        // Copy validation constraints
        if (fieldDef.minimum !== undefined) field.minimum = fieldDef.minimum;
        if (fieldDef.maximum !== undefined) field.maximum = fieldDef.maximum;
        if (fieldDef.minLength !== undefined) field.minLength = fieldDef.minLength;
        if (fieldDef.maxLength !== undefined) field.maxLength = fieldDef.maxLength;
        if (fieldDef.minItems !== undefined) field.minItems = fieldDef.minItems;
        if (fieldDef.maxItems !== undefined) field.maxItems = fieldDef.maxItems;
        if (fieldDef.enum) field.enum = fieldDef.enum;
        if (fieldDef.pattern) field.pattern = fieldDef.pattern;
        
        // Handle nested objects
        if (fieldDef.type === 'object' || (Array.isArray(fieldDef.type) && fieldDef.type.includes('object'))) {
            if (fieldDef.properties) {
                field.properties = {};
                field.additionalProperties = fieldDef.additionalProperties !== undefined ? fieldDef.additionalProperties : false;
                Object.keys(fieldDef.properties).forEach(key => {
                    field.properties[key] = convertField(fieldDef.properties[key]);
                });
                if (fieldDef.required) {
                    field.required = fieldDef.required;
                }
            } else {
                field.additionalProperties = fieldDef.additionalProperties !== undefined ? fieldDef.additionalProperties : false;
            }
        }
        
        // Handle arrays
        if (fieldDef.type === 'array' || (Array.isArray(fieldDef.type) && fieldDef.type.includes('array'))) {
            if (fieldDef.items) {
                if (fieldDef.items.type === 'object' && fieldDef.items.properties) {
                    // Array of objects
                    field.items = {
                        type: 'object',
                        properties: {},
                        required: fieldDef.items.required || [],
                        additionalProperties: fieldDef.items.additionalProperties !== undefined ? fieldDef.items.additionalProperties : false
                    };
                    Object.keys(fieldDef.items.properties).forEach(key => {
                        field.items.properties[key] = convertField(fieldDef.items.properties[key]);
                    });
                } else {
                    // Array of primitives
                    field.items = convertField(fieldDef.items);
                }
            }
        }
        
        if (fieldDef.description) {
            field.description = fieldDef.description;
        }
        
        return field;
    }
    
    Object.keys(schema.properties || {}).forEach(key => {
        jsonSchema.properties[key] = convertField(schema.properties[key]);
    });
    
    return jsonSchema;
}

