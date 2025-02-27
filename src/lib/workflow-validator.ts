/**
 * Re-export the schema validation from the shared schema file
 */
import { validateWorkflowJson, ValidationResult } from './workflow-schema';

export { validateWorkflowJson };
export type { ValidationResult };