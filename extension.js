// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const postcss = require('postcss');

// Helper function to check if CSS contains color declarations
function hasColor(root) {
	let foundColor = false;

	root.walkDecls(decl => {
		if (decl.prop === 'color' ||
			decl.prop === 'background'||
			decl.prop === 'background-color') {
			foundColor = true;
		}
	});

	return foundColor;
}

// Prune CSS AST to only include color-related declarations
function pruneColorNodes(root) {
	// Create a new empty root
	const prunedRoot = postcss.root();

	// Walk through all rules in the original root
	root.walkRules(rule => {
		// Create a new rule to hold filtered declarations
		const newRule = postcss.rule({ selector: rule.selector });

		// Filter declarations
		rule.walkDecls(decl => {
			if (
				decl.prop === 'color' ||
				decl.prop === 'background' ||
				decl.prop === 'background-color'
			) {
				newRule.append(decl.clone());
			}
		});

		// Append rule only if it has color-related declarations
		if (newRule.nodes.length > 0) {
			prunedRoot.append(newRule);
		}
	});

	return prunedRoot;
}

// Convert hex color to RGB array
function hexToRgb(hex) {
	hex = hex.replace('#', '');
	if (hex.length === 3) {
		hex = hex.split('').map(c => c + c).join('');
	}
	const bigint = parseInt(hex, 16);
	return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Calculate relative luminance of an RGB color
function luminance([r, g, b]) {
	const [R, G, B] = [r, g, b].map(v => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Calculate contrast ratio between two RGB colors
function contrastRatio(color1, color2) {
	const L1 = luminance(color1);
	const L2 = luminance(color2);
	const lighter = Math.max(L1, L2);
	const darker = Math.min(L1, L2);
	return (lighter + 0.05) / (darker + 0.05);
}

// Check if all color combinations in CSS meet WCAG AA contrast standards
function checkContrast(prunedRoot) {
	let isAccessible = true;

	prunedRoot.walkRules(rule => {
		let textColor = null;
		let bgColor = null;

		// Collect color and background values
		rule.walkDecls(decl => {
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
			} catch (err) {
				console.warn(`Skipping invalid color in ${rule.selector}:`, err.message);
			}
		}
	});

	return isAccessible;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "accessilinter" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('accessilinter.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showErrorMessage('No active editor. Please open a CSS file.');
			return;
		}

		// Get the CSS text from the editor
		const css = editor.document.getText();

		if (!css.trim()) {
			vscode.window.showErrorMessage('The editor is empty. Please add CSS code.');
			return;
		}

		try {
			// Parse CSS into PostCSS AST
			const root = postcss.parse(css);

			// Check if document contains color declarations
			const containsColor = hasColor(root);

			if (!containsColor) {
				vscode.window.showInformationMessage('No color declarations found in CSS.');
				return;
			}

			// Prune AST to only include color-related nodes
			const prunedRoot = pruneColorNodes(root);

			// Check contrast accessibility
			const isAccessible = checkContrast(prunedRoot);

			if (isAccessible) {
				vscode.window.showInformationMessage('✓ All color contrasts meet WCAG AA standards!');
			} else {
				vscode.window.showWarningMessage('⚠ Some color contrasts do not meet WCAG AA standards (minimum 4.5:1 ratio required).');
			}

			// Log results to console for debugging
			console.log('Has color declarations:', containsColor);
			console.log('Contrast is accessible:', isAccessible);
			console.log('Pruned CSS AST:', JSON.stringify(prunedRoot, null, 2));

		} catch (err) {
			vscode.window.showErrorMessage(`Error parsing CSS: ${err.message}`);
			console.error('CSS parsing error:', err);
		}

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
