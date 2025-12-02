# VS Code Accessibility Linter

A Visual Studio Code extension designed to validate CSS files and verify contrast ratios against required thresholds.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building the Project](#building-the-project)
- [Running and Debugging](#running-and-debugging)
- [Usage](#usage)
- [Authentication](#authentication)

## Prerequisites
This project uses several Node.js modules, including:
- TypeScript
- PostCSS

These are automatically handled via the `package.json` configuration.

## Installation

To set up the project in your local development environment:

1. **Clone the Repository**
   First, clone the project repository from GitHub and obtain it in your local environment.
   ```bash
   git clone https://github.com/anjulij/Accessibility-Linter.git
   ```
2. **Open in VSCode:** Navigate to the retrieved folder and open it in Visual Studio Code.
3. **Install Dependencies:** Install the required dependencies (including TypeScript and PostCSS) by running the following command in the terminal:
```bash
npm install
```

## Building the Project
- **Automatic:** TypeScript is automatically compiled when launching the debugger.

- **Manual:** If you need to manually build the project, run:
  ```bash
  npm run build
  ```
## Running and Debugging
To test the extension, you must launch it in the **Extension Development Host.**

  1. Press **F5** or select **Run > Start Debugging** from the menu.
  2. A new Visual Studio Code window (the Extension Development Host) will open.

 ## Authentication 
 1. Under **Account** in VSCode you will see a prompt to Sign in with Github to use Accessibility Linter.
 2. Follow the prompts to authenticate using VSCode's built-in system.

    
  ## Usage
  Once the Extension Development Host is running, you can use the linter on your files.

  1. **Open a File:** Open a CSS file in the new window.
  2. **Run the Linter:**
     -  Open the Command Palette (**Ctrl+Shift+P** on Windows / **Cmd+Shift+P** on macOS).
     -  Run the command: Accessibility Linter: Lint.
  3. **View Results:** The extension will display a message indicating whether the contrast ratio meets the required threshold.
 



   
