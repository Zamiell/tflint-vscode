import * as vscode from "vscode";
import { config, searchFileInWorkspace } from "./common/vscode";
import { getAbsoluteFilePath, checkIfFileExists } from "./common/file";

export interface ExtensionConfiguration {
  binPath?: string;
  configFilePath?: string;
  fixOnSave: boolean;
}

export async function loadConfig(): Promise<ExtensionConfiguration> {
  const workspace = config("tflint-vscode");
  const binPath = workspace.get<string>("tfLintBinPath") || "tflint";
  const fixOnSave = workspace.get<boolean>("fixOnSave") || false;
  let configFilePath =
    workspace.get<string>("configFile") ||
    (await searchFileInWorkspace(".tflint.hcl"));

  if (configFilePath) {
    configFilePath = getAbsoluteFilePath(configFilePath);

    if (!checkIfFileExists(configFilePath)) {
      vscode.window.showErrorMessage(
        `Configured tflint config file could not be found at: ${configFilePath}`,
      );
      configFilePath = undefined;
    }
  }

  const configuration: ExtensionConfiguration = {
    binPath: binPath,
    configFilePath: configFilePath,
    fixOnSave: fixOnSave,
  };

  return configuration;
}
