/**
 * Debug tools for workflow JSON files
 */
import { validateWorkflowJson, ValidationResult } from './workflow-schema';

/**
 * Debug result interface
 */
export interface DebugResult {
  parsed: unknown; // Replace with the actual type if known
  validationResult: ValidationResult;
}

/**
 * Debug workflow JSON file
 * This function is used to debug workflow JSON files
 * 
 * @param jsonContent The JSON content as a string
 * @returns Debug result with parsed JSON and validation result
 */
export function debugWorkflowJson(jsonContent: string): DebugResult {
  let parsed = null;
  
  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    return {
      parsed: null,
      validationResult: {
        valid: false,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`]
      }
    };
  }
  
  const validationResult = validateWorkflowJson(jsonContent);
  
  return {
    parsed,
    validationResult
  };
}