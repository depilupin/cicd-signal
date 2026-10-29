import {
  type SeverityType,
  type ConfidenceType,
  type DetectionCategoryType,
} from "@signal/shared";

export interface RuleMetadata {
  id: string;
  name: string;
  version: string;
  category: DetectionCategoryType;
  defaultSeverity: SeverityType;
  defaultConfidence: ConfidenceType;
  description: string;
  remediation: string;
  cweIds?: string[];
  references?: string[];
}

export interface RuleFinding {
  ruleId: string;
  ruleVersion: string;
  category: DetectionCategoryType;
  severity: SeverityType;
  confidence: ConfidenceType;
  title: string;
  filePath: string;
  startLine: number;
  endLine: number;
  snippet?: string;
  message: string;
  remediation: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowFile {
  path: string;
  content: string;
  sha?: string;
}

export interface ScannerContext {
  scanId: string;
  repositoryId: string;
  commitSha: string;
  file: WorkflowFile;
}

export interface ScannerRule {
  readonly metadata: RuleMetadata;
  evaluate(context: ScannerContext): Promise<RuleFinding[]> | RuleFinding[];
}
