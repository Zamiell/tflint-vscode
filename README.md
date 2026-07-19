# TFLint VSCode Extension (Experimental)

> ⚠️ **Experimental!** This is a proof-of-concept VS Code extension for linting Terraform files using [TFLint](https://github.com/terraform-linters/tflint). It is not production-ready and the behaviour might change. Use at your own risk. This extension is only tested on MacOS & Windows with WSL2.

**Note!** This extension is currently not shipped with a TFLint bin. Please make sure TFLint is installed in your $PATH, or optionally configured in vscode settings.

## Highlights

![Demo](assets/demo.gif)

## Features

- Runs **TFLint** on Terraform files (`.tf`) in your workspace.
- Displays linting diagnostics directly in VS Code.

# Usage

Once installed in Visual Studio Code, TFLint will automatically lint the active
Terraform file's directory on startup and whenever a Terraform file is saved.

# Settings

You can configure tflint-vscode with custom, optional settings in the .vscode/settings.json file:

```json
{
  "tflint-vscode.configFile": ".tflint.hcl",
  "tflint-vscode.tfLintBinPath": "/path/to/tflint/bin",
  "tflint-vscode.fixOnSave": false
}
```
