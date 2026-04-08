import * as vscode from "vscode";
import { execFile, ExecFileException } from "child_process";
import { TFLintResult } from "../models/tflint";
import { logger } from "./logger";
import { ExtensionConfiguration } from "../settings";
import { dirname } from "path";

class Linter {
  private config: ExtensionConfiguration | null = null;
  private fileWatcher: vscode.FileSystemWatcher | null = null;

  async init(config: ExtensionConfiguration): Promise<void> {
    this.config = config;

    if (!config.configFilePath) {
      logger.debug("No config file path provided, skipping tflint --init");
      return;
    }

    const dir = dirname(config.configFilePath);
    if (!dir) {
      logger.warn("Invalid config directory, skipping tflint --init");
      return;
    }

    this.createFileWatcher();

    return new Promise((resolve, reject) => {
      const args = ["--chdir", dir, "--init"];
      const binPath = this.config!.binPath || "tflint";
      logger.info(`Running cmd: ${binPath} ${args.join(" ")}`);

      execFile(binPath, args, (err: ExecFileException | null) => {
        if (err) {
          logger.error(`tflint init error:`, err);
          reject(err);
          return;
        }
        logger.info("tflint init completed successfully");
        resolve();
      });
    });
  }

  private createFileWatcher() {
    if (!this.config?.configFilePath) {
      return;
    }

    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }

    logger.debug(`Creating file watcher for ${this.config.configFilePath}`);
    const watcher = vscode.workspace.createFileSystemWatcher(this.config.configFilePath);
    this.fileWatcher = watcher;

    watcher.onDidChange(async () => {
      logger.info("TFLint config file changed, re-initializing...");
      await this.init(this.config!);
    });

    watcher.onDidDelete(() => {
      logger.info("TFLint config file deleted");
      this.config!.configFilePath = undefined;
    });

    // in the event that the config file is created again
    watcher.onDidCreate(async (uri) => {
      logger.info("TFLint config file created, re-initializing...");
      this.config!.configFilePath = uri.fsPath;
      await this.init(this.config!);
    });
  }

  async run(pathToLint: string, fix: boolean): Promise<TFLintResult> {
    const options = this.buildTFLintOptions(fix);
    const args = this.buildCommand(pathToLint, options);

    return this.executeTFLint(args);
  }

  private buildTFLintOptions(fix: boolean): string[] {
    const options: string[] = [];

    if (this.config?.configFilePath) {
      options.push("--config", this.config.configFilePath);
    }

    if (fix) {
      options.push("--fix");
    }

    return options;
  }

  private buildCommand(pathToLint: string, options: string[]): string[] {
    return [
      `--chdir`,
      pathToLint,
      "--recursive",
      "--format",
      "json",
      "--force",
      ...options,
    ];
  }

  private executeTFLint(args: string[]): Promise<TFLintResult> {
    return new Promise((resolve, reject) => {
      const binPath = this.config!.binPath || "tflint";
      logger.info(`Executing: ${binPath} ${args.join(" ")}`);
      execFile(binPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err: ExecFileException | null, stdout: string) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const result: TFLintResult = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          logger.error("JSON parse error:", e);
          reject(e);
        }
      });
    });
  }
}

export const linter: Linter = new Linter();
