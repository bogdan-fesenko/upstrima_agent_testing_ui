/**
 * Workflow schema definitions for validation
 * 
 * This file contains the JSON schema definitions for validating workflow JSON files.
 * It should be kept in sync with the backend schema in src/utils/json_schema.py.
 */

// Workflow definition schema
export const WORKFLOW_SCHEMA = {
  type: "object",
  required: ["name", "nodes", "edges"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "config"],
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          config: { type: "object" }
        }
      }
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["source", "target", "data"],
        properties: {
          source: { type: "string" },
          target: { type: "string" },
          data: {
            type: "object",
            required: ["sourceOutput", "targetInput"],
            properties: {
              sourceOutput: { type: "string" },
              targetInput: { type: "string" }
            }
          }
        }
      }
    },
    config: { type: "object" }
  }
};

// Define schema types
interface SchemaProperty {
  type: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: any;
  oneOf?: any[];
  required?: string[];
  properties?: Record<string, SchemaProperty>;
}

interface NodeSchema {
  type: string;
  required?: string[];
  properties: Record<string, SchemaProperty>;
}

// Node type schemas
export const NODE_TYPE_SCHEMAS: Record<string, NodeSchema> = {
  LLMNode: {
    type: "object",
    properties: {
      model: { type: "string" },
      system_prompt: { type: "string" },
      tools: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            parameters: { type: "object" }
          }
        }
      },
      max_tokens: { type: "integer", minimum: 1 },
      temperature: { type: "number", minimum: 0, maximum: 2 },
      memory_enabled: { type: "boolean" },
      memory_window_size: { type: "integer", minimum: 1 }
    }
  },
  HttpRequestNode: {
    type: "object",
    properties: {
      method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] },
      url: { type: "string" },
      headers: { type: "object" },
      timeout: { type: "integer", minimum: 1 },
      retry_count: { type: "integer", minimum: 0 },
      retry_backoff: { type: "number", minimum: 1 },
      verify_ssl: { type: "boolean" }
    }
  },
  FileParserNode: {
    type: "object",
    properties: {
      file_type: { type: "string", enum: ["auto", "json", "csv", "yaml", "xml", "text"] },
      csv_delimiter: { type: "string" },
      csv_quotechar: { type: "string" },
      encoding: { type: "string" },
      strict_mode: { type: "boolean" },
      supported_formats: {
        type: "array",
        items: { type: "string" }
      },
      extraction_mode: { type: "string" },
      table_extraction: { type: "boolean" },
      ocr_enabled: { type: "boolean" },
      max_file_size_mb: { type: "number" }
    }
  },
  DataTransformNode: {
    type: "object",
    properties: {
      transformations: {
        type: "any", // Using 'any' to allow both object and array
        oneOf: [
          { type: "object" },
          { type: "array", items: { type: "object" } }
        ]
      },
      default_values: { type: "object" },
      output_schema: { type: "object" }
    }
  },
  InputNode: {
    type: "object",
    properties: {
      input_fields: {
        type: "array",
        items: { type: "string" }
      }
    }
  },
  OutputNode: {
    type: "object",
    properties: {
      output_fields: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
};

/**
 * Validate a workflow JSON file
 * 
 * @param jsonContent The JSON content as a string
 * @returns Validation result with any errors
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWorkflowJson(jsonContent: string): ValidationResult {
  const errors: string[] = [];
  
  try {
    // Try to parse the JSON
    const parsed = JSON.parse(jsonContent);
    
    // Check required top-level fields
    if (!parsed.name || typeof parsed.name !== 'string') {
      errors.push('Missing or invalid "name" field');
    }
    
    // Check nodes array
    if (!Array.isArray(parsed.nodes)) {
      errors.push('Missing or invalid "nodes" array');
    } else {
      // Check each node
      parsed.nodes.forEach((node: any, index: number) => {
        if (!node.id) {
          errors.push(`Node at index ${index} is missing an "id" field`);
        }
        if (!node.type) {
          errors.push(`Node at index ${index} is missing a "type" field`);
        }
        if (!node.config || typeof node.config !== 'object') {
          errors.push(`Node at index ${index} is missing a "config" object`);
        }
        
        // Validate node config against schema if available
        const nodeType = node.type as keyof typeof NODE_TYPE_SCHEMAS;
        if (nodeType && NODE_TYPE_SCHEMAS[nodeType]) {
          // Basic validation - in a real implementation, you would use a JSON schema validator
          // This is a simplified version
          const schema = NODE_TYPE_SCHEMAS[nodeType];
          
          // Check for required properties
          if (schema.required) {
            for (const requiredProp of schema.required) {
              if (!(requiredProp in node.config)) {
                errors.push(`Node "${node.id}" (${nodeType}) is missing required config property: ${requiredProp}`);
              }
            }
          }
        } else if (nodeType) {
          errors.push(`Unknown node type: ${nodeType}`);
        }
      });
    }
    
    // Check edges array
    if (!Array.isArray(parsed.edges)) {
      errors.push('Missing or invalid "edges" array');
    } else {
      // Check each edge
      parsed.edges.forEach((edge: any, index: number) => {
        if (!edge.source) {
          errors.push(`Edge at index ${index} is missing a "source" field`);
        }
        if (!edge.target) {
          errors.push(`Edge at index ${index} is missing a "target" field`);
        }
        if (!edge.data || typeof edge.data !== 'object') {
          errors.push(`Edge at index ${index} is missing a "data" object`);
        } else {
          if (!edge.data.sourceOutput) {
            errors.push(`Edge at index ${index} is missing a "data.sourceOutput" field`);
          }
          if (!edge.data.targetInput) {
            errors.push(`Edge at index ${index} is missing a "data.targetInput" field`);
          }
        }
      });
    }
    
    // Check node references in edges
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      const nodeIds = new Set(parsed.nodes.map((node: any) => node.id));
      
      parsed.edges.forEach((edge: any, index: number) => {
        if (edge.source && !nodeIds.has(edge.source)) {
          errors.push(`Edge at index ${index} references non-existent source node: "${edge.source}"`);
        }
        if (edge.target && !nodeIds.has(edge.target)) {
          errors.push(`Edge at index ${index} references non-existent target node: "${edge.target}"`);
        }
      });
      
      // Check input node fields
      const inputNode = parsed.nodes.find((node: any) => node.type === "InputNode");
      if (inputNode && Array.isArray(inputNode.config?.input_fields)) {
        const inputFields = new Set(inputNode.config.input_fields);
        
        // Check if edges reference fields not in input_fields
        const inputNodeEdges = parsed.edges.filter((edge: any) => edge.source === inputNode.id);
        inputNodeEdges.forEach((edge: any) => {
          if (edge.data?.sourceOutput && !inputFields.has(edge.data.sourceOutput)) {
            errors.push(`Edge from InputNode references field "${edge.data.sourceOutput}" which is not defined in input_fields`);
          }
        });
      }
    }
    
  } catch (error) {
    errors.push(`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}