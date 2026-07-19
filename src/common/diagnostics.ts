import * as vscode from "vscode";
import path from "path";
import { TFLintResult, TFLintIssue } from "../models/tflint";
import { logger } from "./logger";

export function resolveDiagnosticFilePath(
  lintPath: string,
  filename: string,
): string {
  return path.isAbsolute(filename)
    ? filename
    : path.resolve(lintPath, filename);
}

class DiagnosticsHandler {
  public collection = vscode.languages.createDiagnosticCollection("TFLint");

  publish(result: TFLintResult, lintPath: string) {
    const unresolvedIssues = result.issues.filter((issue) => !issue.fixed);
    logger.info(`Found ${unresolvedIssues.length} unresolved issues`);
    result.errors.forEach((error) => {
      logger.error(`TFLint error: ${error.message}`);
    });

    var diagnosticsByFile: Record<string, vscode.Diagnostic[]> = {};
    result.issues.forEach((issue: TFLintIssue) => {
      const filename = resolveDiagnosticFilePath(
        lintPath,
        issue.range.filename,
      );
      diagnosticsByFile[filename] ??= [];

      if (issue.fixed) {
        return;
      }

      // Convert from 1-based to 0-based indexing
      const startLine = Math.max(0, issue.range.start.line - 1);
      const startChar = Math.max(0, issue.range.start.column - 1);
      const endLine = Math.max(startLine, issue.range.end.line - 1);
      const endChar = Math.max(startChar, issue.range.end.column - 1);

      const range = new vscode.Range(startLine, startChar, endLine, endChar);

      var severity: vscode.DiagnosticSeverity;
      if (issue.rule.severity === "info") {
        severity = vscode.DiagnosticSeverity.Information;
      } else if (issue.rule.severity === "warning") {
        severity = vscode.DiagnosticSeverity.Warning;
      } else {
        severity = vscode.DiagnosticSeverity.Warning;
      }

      const diag = new vscode.Diagnostic(range, issue.message, severity);

      diag.code = {
        value: issue.rule.name,
        target: vscode.Uri.parse(issue.rule.link),
      };
      diag.source = "tflint-vscode";
      diagnosticsByFile[filename].push(diag);
    });

    for (var key in diagnosticsByFile) {
      this.collection.set(vscode.Uri.file(key), diagnosticsByFile[key]);
    }
  }
}

export const diagnostics: DiagnosticsHandler = new DiagnosticsHandler();
