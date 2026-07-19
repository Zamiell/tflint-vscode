import assert from "node:assert/strict";
import path from "node:path";
import * as vscode from "vscode";
import { diagnostics, resolveDiagnosticFilePath } from "../common/diagnostics";
import { buildTFLintCommand, parseTFLintResult } from "../common/linter";
import { TFLintResult } from "../models/tflint";

suite("Diagnostics", () => {
  test("resolves relative filenames from the lint directory", () => {
    const lintPath = path.join(
      path.parse(process.cwd()).root,
      "workspace",
      "modules",
      "aks",
    );

    assert.equal(
      resolveDiagnosticFilePath(lintPath, "aks.tf"),
      path.join(lintPath, "aks.tf"),
    );
  });

  test("publishes custom-rule diagnostics without a rule link", () => {
    const lintPath = path.join(
      path.parse(process.cwd()).root,
      "workspace",
      "modules",
      "aks",
    );
    const fileUri = vscode.Uri.file(path.join(lintPath, "aks.tf"));
    const result: TFLintResult = {
      errors: [],
      issues: [
        {
          callers: [],
          fixable: true,
          fixed: false,
          message: "lists with a single value must use inline format",
          range: {
            end: { column: 4, line: 20 },
            filename: "aks.tf",
            start: { column: 30, line: 18 },
          },
          rule: {
            link: "",
            name: "foo_list_format",
            severity: "error",
          },
        },
      ],
    };

    diagnostics.publish(result, lintPath);

    assert.equal(diagnostics.collection.get(fileUri)?.length, 1);
    diagnostics.collection.delete(fileUri);
  });

  test("clears diagnostics for issues fixed by TFLint", () => {
    const lintPath = path.join(
      path.parse(process.cwd()).root,
      "workspace",
      "modules",
      "aks",
    );
    const fileUri = vscode.Uri.file(path.join(lintPath, "aks.tf"));
    const existingDiagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 1),
      "Existing issue",
    );
    diagnostics.collection.set(fileUri, [existingDiagnostic]);
    const result: TFLintResult = {
      errors: [],
      issues: [
        {
          callers: [],
          fixable: true,
          fixed: true,
          message: "lists with a single value must use inline format",
          range: {
            end: { column: 4, line: 20 },
            filename: "aks.tf",
            start: { column: 30, line: 18 },
          },
          rule: {
            link: "",
            name: "foo_list_format",
            severity: "error",
          },
        },
      ],
    };

    diagnostics.publish(result, lintPath);

    assert.deepEqual(diagnostics.collection.get(fileUri), []);
    diagnostics.collection.delete(fileUri);
  });

  test("parses lint results when TFLint exits with an error", () => {
    const stdout = JSON.stringify({
      errors: [{ message: "A nested directory failed to lint" }],
      issues: [{ message: "A valid issue" }],
    });

    const result = parseTFLintResult(stdout, new Error("TFLint exited 1"));

    assert.equal(result.issues.length, 1);
    assert.equal(result.errors.length, 1);
  });

  test("does not recursively lint a file directory by default", () => {
    assert.deepEqual(buildTFLintCommand([], false), [
      "--format",
      "json",
      "--force",
    ]);
  });

  test("recursively lints when explicitly requested", () => {
    assert.deepEqual(buildTFLintCommand([], true), [
      "--recursive",
      "--format",
      "json",
      "--force",
    ]);
  });
});
