import * as vscode from "vscode";
import { linter } from "./common/linter";
import { diagnostics } from "./common/diagnostics";
import { loadConfig } from "./settings";
import { logger } from "./common/logger";
import { getAllWorkspacePaths } from "./common/vscode";
import path from "path";

export async function activate(context: vscode.ExtensionContext) {
  let config = await loadConfig();
  await linter.init(config);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("tflint-vscode")) {
        logger.info("Config changed: Reloading configuration");
        config = await loadConfig();
        linter.init(config);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (!document.fileName.endsWith(".tf")) {
        return;
      }

      diagnostics.collection.set(document.uri, []);
      await lintOnFile(document, config.fixOnSave);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.lint", async () => {
      const workspaces = getAllWorkspacePaths();
      await lintOnPaths(workspaces, false, true);
      vscode.window.showInformationMessage("Project linted");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.lint-fix", async () => {
      const workspaces = getAllWorkspacePaths();
      await lintOnPaths(workspaces, true, true);

      vscode.window.showInformationMessage("Project linted & auto fixed");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.initialize", async () => {
      linter.init(config);
      vscode.window.showInformationMessage("TFLint Plugins initialized");
    }),
  );

  const activeDocument = vscode.window.activeTextEditor?.document;
  if (activeDocument?.fileName.endsWith(".tf")) {
    await lintOnFile(activeDocument);
  }
}

async function lintOnPaths(
  pathsToLint: string[],
  withFix: boolean = false,
  recursive: boolean = false,
) {
  for (var pathToLint of pathsToLint) {
    const result = await linter.run(pathToLint, withFix, recursive);
    diagnostics.publish(result, pathToLint);
  }
}

async function lintOnFile(
  document: vscode.TextDocument,
  withFix: boolean = false,
) {
  const pathToLint = path.dirname(document.uri.fsPath);
  await lintOnPaths([pathToLint], withFix);
}

// This method is called when your extension is deactivated
export function deactivate() {}
