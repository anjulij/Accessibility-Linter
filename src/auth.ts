import * as vscode from 'vscode';

// Define a union type for authentication states
// "signed-out"  = no valid GitHub session
// "cancelled"   = user dismissed the login prompt
// "signed-in"   = valid session with access token and scopes
export type AuthState =
  | { status: 'signed-out' }
  | { status: 'cancelled' }
  | { status: 'signed-in'; token: string; scopes: readonly string[]; user?: string };

  // The ID of the authentication provider (in this case, GitHub)
const PROVIDER = 'github';
const SCOPES = ['read:user'];

export const AUTH_REQUIRED = 'AUTH_REQUIRED';

/**
 * ensureAuth()
 * 
 * Ensures that the user is authenticated with GitHub.
 * If the user is not signed in, VSCode will automatically show the GitHub login prompt.
 * Returns the authentication state (either signed-in with token, or signed-out).
 */
export async function ensureAuth(): Promise<AuthState> {
  const session = await vscode.authentication.getSession(PROVIDER, SCOPES, { createIfNone: true });
  if (!session) return { status: 'cancelled' };

  return {
    status: 'signed-in',
    token: session.accessToken,
    scopes: session.scopes,
    user: session.account?.label
  };
}

/**
 * getAuthStatus()
 * 
 * Checks the current GitHub authentication status silently (no login prompt).
 */
export async function getAuthStatus(): Promise<AuthState> {
  const session = await vscode.authentication.getSession(PROVIDER, SCOPES, { createIfNone: false });
  if (!session) return { status: 'signed-out' };

  return {
    status: 'signed-in',
    token: session.accessToken,
    scopes: session.scopes,
    user: session.account?.label
  };
}

/**
 * requireAuth()
 * 
 * A helper function that enforces authentication before executing a secured operation.
 * - If the user is signed in, the callback (op) runs with the GitHub token.
 * - If not, it throws an AUTH_REQUIRED error to be caught by the caller.
 */
export async function requireAuth<T>(op: (token: string) => Promise<T>): Promise<T> {
  const state = await ensureAuth();

  if (state.status != 'signed-in') 
    throw new Error(AUTH_REQUIRED);
  return op(state.token);
}

/**
 * observeAuthChanges()
 * 
 * Listens for changes in the authentication sessions.
 * This fires when the user signs in or out of GitHub via the VSCode Accounts menu.
 */
export function observeAuthChanges(cb: () => void) {
  return vscode.authentication.onDidChangeSessions(e => {
    if (e.provider.id === PROVIDER) cb();
  });
}