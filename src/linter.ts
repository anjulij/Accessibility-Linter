import * as vscode from 'vscode';
import postcss, { Root } from 'postcss';

// Helper function to check if CSS contains color declarations
function hasColor(root: Root): boolean {
  let foundColor = false;

  root.walkDecls((decl: any) => {
    if (
      decl.prop === 'color' ||
      decl.prop === 'background' ||
      decl.prop === 'background-color'
    ) {
      foundColor = true;
    }
  });

  return foundColor;
}

// Prune CSS AST to only include color-related declarations
function pruneColorNodes(root: Root): Root {
  // Create a new empty root
  const prunedRoot = postcss.root();

  // Walk through all rules in the original root
  root.walkRules((rule: any) => {
    // Create a new rule to hold filtered declarations
    const newRule = postcss.rule({ selector: rule.selector });

    // Filter declarations
    rule.walkDecls((decl: any) => {
      if (
        decl.prop === 'color' ||
        decl.prop === 'background' ||
        decl.prop === 'background-color'
      ) {
        newRule.append(decl.clone());
      }
    });

    // Append rule only if it has color-related declarations
    if (newRule.nodes && newRule.nodes.length > 0) {
      prunedRoot.append(newRule);
    }
  });

  return prunedRoot;
}

// Convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const bigint = parseInt(hex, 16);
  return [((bigint >> 16) & 255), ((bigint >> 8) & 255), (bigint & 255)];
}

// Calculate relative luminance of an RGB color
function luminance([r, g, b]: [number, number, number]): number {
  const [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Calculate contrast ratio between two RGB colors
function contrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const L1 = luminance(color1);
  const L2 = luminance(color2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if all color combinations in CSS meet WCAG AA contrast standards
function checkContrast(prunedRoot: Root): boolean {
  let isAccessible = true;

  prunedRoot.walkRules((rule: any) => {
    let textColor: string | null = null;
    let bgColor: string | null = null;

    // Collect color and background values
    rule.walkDecls((decl: any) => {
      if (decl.prop === 'color') {
        textColor = decl.value.trim();
      }
      if (decl.prop === 'background' || decl.prop === 'background-color') {
        bgColor = decl.value.trim();
      }
    });

    // If both colors exist, check contrast
    if (textColor && bgColor) {
      try {
        const rgbText = hexToRgb(textColor);
        const rgbBg = hexToRgb(bgColor);
        const ratio = contrastRatio(rgbText, rgbBg);

        if (ratio < 4.5) {
          isAccessible = false;
        }
      } catch (err: any) {
        console.warn(`Skipping invalid color in ${rule.selector}:`, err.message);
      }
    }
  });

  return isAccessible;
}

// Activate the linter (registers a command that runs the color contrast checks)
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "accessibility - linter" is now active!');

  const disposable = vscode.commands.registerCommand('accessibility-linter.lint', () => {
    runLint();
  });

  context.subscriptions.push(disposable);
}

// The actual linting logic that can be called from extension.ts
export function runLint() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No active editor. Please open a CSS file.');
    return;
  }

  const css = editor.document.getText();

  if (!css.trim()) {
    vscode.window.showErrorMessage('The editor is empty. Please add CSS code.');
    return;
  }

  try {
    const root = postcss.parse(css) as Root;

    const containsColor = hasColor(root);

    if (!containsColor) {
      vscode.window.showInformationMessage('No color declarations found in CSS.');
      return;
    }

    const prunedRoot = pruneColorNodes(root);

    const isAccessible = checkContrast(prunedRoot);

    if (isAccessible) {
      vscode.window.showInformationMessage('✓ All color contrasts meet WCAG AA standards!');
    } else {
      vscode.window.showWarningMessage('⚠ Some color contrasts do not meet WCAG AA standards (minimum 4.5:1 ratio required).');
    }

    console.log('Has color declarations:', containsColor);
    console.log('Contrast is accessible:', isAccessible);
    console.log('Pruned CSS AST:', JSON.stringify(prunedRoot, null, 2));

  } catch (err: any) {
    vscode.window.showErrorMessage(`Error parsing CSS: ${err.message}`);
    console.error('CSS parsing error:', err);
  }
}

export function deactivate() {}

// compatibility exports to match the previous JS module shape
export const startLinting = activate;

export default { activate, deactivate, startLinting, runLint };
