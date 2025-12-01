import * as vscode from 'vscode';
import postcss, { Root } from 'postcss';
import {
  ensureAuth,
  getAuthStatus,
  observeAuthChanges,
  requireAuth,
  AUTH_REQUIRED,
  AuthState
} from './auth';
import { stringify } from 'querystring';


async function parse(css: string): Promise<Root> {
	const root = postcss.parse(css)

	console.log('PostCSS AST');
	console.log(JSON.stringify(root, null, 2))

	return root;
}

async function runRules(root: Root) {
  // Apply rule filters to the AST (placeholder)
  // Produces 1 fake issue when the length is odd
	const length = root.toString().length;

	return length % 2 === 0
		? []
		: [{ rule: 'demo-odd-length', message: 'Length is odd' }];
}

function handleAuthState(
  state: AuthState,
  handlers: {
    onSignedIn: (user?: string) => void;
    onCancelled: () => void;
    onSignedOut: () => void;
  }
) {
  switch (state.status) {
    case 'signed-in':
      handlers.onSignedIn(state.user);
      break;
    case 'cancelled':
      handlers.onCancelled();
      break;
    case 'signed-out':
    default:
      handlers.onSignedOut();
      break;
  }
}



export function activate(context: vscode.ExtensionContext) {
  console.log('Your extension "accessibility-linter" is now active!');

	const helloCmd = vscode.commands.registerCommand(
		'accessibility-linter.helloWorld',
		() => {
			vscode.window.showInformationMessage('Hello World from accessibility-linter!');
		}
  	);

	const loginCmd = vscode.commands.registerCommand(
		'accessibility-linter.loginWithGitHub',
		async () => {
			const state = await ensureAuth();

			handleAuthState(state, {
				onSignedIn: user => {
					vscode.window.showInformationMessage(
						`Signed in to GitHub as ${user ?? 'GitHub user'}.`
					);
				},
				onCancelled: () => {
					vscode.window.showInformationMessage('GitHub login was cancelled.');
				},
				onSignedOut: () => {
					vscode.window.showWarningMessage('Not signed in to GitHub.');
				}
			});
		}
	);

	const statusCmd = vscode.commands.registerCommand(
		'accessibility-linter.showAuthStatus',
		async () => {
		const state = await getAuthStatus();

		handleAuthState(state, {
			onSignedIn: user => {
			vscode.window.showInformationMessage(
				`Currently signed in to GitHub as ${user ?? 'GitHub user'}.`
			);
			},
			onCancelled: () => {
			vscode.window.showInformationMessage('No GitHub login attempt in progress.');
			},
			onSignedOut: () => {
			vscode.window.showInformationMessage('You are not signed in to GitHub.');
			}
		});
		}
	);

	const syncCmd = vscode.commands.registerCommand(
		'accessibility-linter.syncSettingsWithGitHub',
		async () => {
		try {
			await requireAuth(async token => {
			console.log('GitHub token: ', token);
			vscode.window.showInformationMessage(
				'Settings sync (stub) executed with GitHub token.'
			);
			});
		} catch (err) {
			if (err instanceof Error && err.message === AUTH_REQUIRED) {
			vscode.window.showWarningMessage('GitHub login is required to sync settings.');
			} else {
			vscode.window.showErrorMessage('Unexpected error while syncing settings.');
			console.error(err);
			}
		}
		}
	);

	const demoLintCmd = vscode.commands.registerCommand(
		'accessibility-linter.demoLint',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showWarningMessage('No active editor.');
				return;
			}
			const doc = editor.document;
			const css = doc.getText();

			const root = await parse(css);
			const issues = await runRules(root);

			const result = root.toResult();
    		const outputCss = result.css;

			const outputDoc = await vscode.workspace.openTextDocument({
				content: outputCss,
				language: 'css'
			});
			vscode.window.showTextDocument(outputDoc, vscode.ViewColumn.Beside);

			if (issues.length === 0) {
				vscode.window.showInformationMessage('No demo issues found.');
			} else {
				vscode.window.showWarningMessage(
				`Demo lint found ${issues.length} issue(s): ${issues[0].message}`
				);
			}
		}
	);

	const authListener = observeAuthChanges(async () => {
		const state = await getAuthStatus();
		handleAuthState(state, {
		onSignedIn: user => {
			console.log(`GitHub session changed: signed in as ${user ?? 'GitHub user'}.`);
		},
		onCancelled: () => {
		},
		onSignedOut: () => {
			console.log('GitHub session changed: signed out.');
		}
		});
	});

	context.subscriptions.push(
    helloCmd,
    loginCmd,
    statusCmd,
    syncCmd,
    demoLintCmd,
    authListener
  );
}

export function deactivate() {}
