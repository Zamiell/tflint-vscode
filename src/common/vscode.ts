import * as vscode from "vscode";
import { logger } from "./logger";

export function config(section: string): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section);
}

export function getProjectRoot(): string | undefined {
  const workspace = vscode.workspace.workspaceFolders;
  if (workspace) {
    return workspace[0].uri.path;
  }
  return undefined;
}

export function getAllWorkspacePaths() {
  const workspaces = vscode.workspace.workspaceFolders;
  const result: string[] = [];
  if (workspaces) {
    for (var key in workspaces) {
      result.push(workspaces[key].uri.fsPath);
    }
  }
  return result;
}

export async function searchFileInWorkspace(
  fileName: string,
): Promise<string | undefined> {
  const files = await vscode.workspace.findFiles(
    `**/${fileName}`,
    `**/.terraform/**`,
    1,
  );

  if (files.length === 1) {
    logger.debug(`Found file at ${files[0].path}`);
    return files[0].path;
  }
  logger.warn(`Could not find file ${fileName} in current workspace`);
  return undefined;
}
