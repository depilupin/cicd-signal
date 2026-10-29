import { z } from "zod";

export const Severity = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "INFO",
} as const;

export type SeverityType = (typeof Severity)[keyof typeof Severity];

export const SeveritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);

export const Confidence = {
  CONFIRMED: "CONFIRMED",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type ConfidenceType = (typeof Confidence)[keyof typeof Confidence];

export const ConfidenceSchema = z.enum(["CONFIRMED", "HIGH", "MEDIUM", "LOW"]);

export const ScanStatus = {
  QUEUED: "QUEUED",
  FETCHING: "FETCHING",
  ANALYZING: "ANALYZING",
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type ScanStatusType = (typeof ScanStatus)[keyof typeof ScanStatus];

export const ScanStatusSchema = z.enum([
  "QUEUED",
  "FETCHING",
  "ANALYZING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
  "CANCELLED",
]);

export const DetectionCategory = {
  SECRET_EXPOSURE: "SECRET_EXPOSURE",
  DANGEROUS_PERMISSIONS: "DANGEROUS_PERMISSIONS",
  THIRD_PARTY_ACTIONS: "THIRD_PARTY_ACTIONS",
  SELF_HOSTED_RUNNERS: "SELF_HOSTED_RUNNERS",
  WORKFLOW_INJECTION: "WORKFLOW_INJECTION",
  SUPPLY_CHAIN_RISKS: "SUPPLY_CHAIN_RISKS",
  CLOUD_CREDENTIALS: "CLOUD_CREDENTIALS",
  COMMAND_EXECUTION: "COMMAND_EXECUTION",
  ARTIFACT_BUILD_RISKS: "ARTIFACT_BUILD_RISKS",
  SECURITY_MISCONFIGURATION: "SECURITY_MISCONFIGURATION",
} as const;

export type DetectionCategoryType =
  (typeof DetectionCategory)[keyof typeof DetectionCategory];

export const DetectionCategorySchema = z.enum([
  "SECRET_EXPOSURE",
  "DANGEROUS_PERMISSIONS",
  "THIRD_PARTY_ACTIONS",
  "SELF_HOSTED_RUNNERS",
  "WORKFLOW_INJECTION",
  "SUPPLY_CHAIN_RISKS",
  "CLOUD_CREDENTIALS",
  "COMMAND_EXECUTION",
  "ARTIFACT_BUILD_RISKS",
  "SECURITY_MISCONFIGURATION",
]);

export const PlanId = {
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
} as const;

export type PlanIdType = (typeof PlanId)[keyof typeof PlanId];

export const PlanIdSchema = z.enum(["month", "quarter", "year"]);

export const FindingStatus = {
  OPEN: "OPEN",
  VALIDATING: "VALIDATING",
  VALIDATED: "VALIDATED",
  DISMISSED: "DISMISSED",
  FIXED: "FIXED",
} as const;

export type FindingStatusType = (typeof FindingStatus)[keyof typeof FindingStatus];

export const FindingStatusSchema = z.enum([
  "OPEN",
  "VALIDATING",
  "VALIDATED",
  "DISMISSED",
  "FIXED",
]);

export interface FindingSummary {
  id: string;
  ruleId: string;
  category: DetectionCategoryType;
  severity: SeverityType;
  confidence: ConfidenceType;
  title: string;
  filePath: string;
  startLine: number;
  endLine: number;
  status: FindingStatusType;
}
