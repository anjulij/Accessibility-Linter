import * as vscode from 'vscode';

// Authentication state types
export type AuthState =
  | { status: 'signed-out' }
  | { status: 'cancelled' }
  | { status: 'signed-in'; token: string; scopes: readonly string[]; user?: string };

const PROVIDER = 'github';
const SCOPES = ['read:user'];

export const AUTH_REQUIRED = 'AUTH_REQUIRED';

/*
ensureAuth()
Prompts login if needed. Returns the current auth state.
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

/*
getAuthStatus()
Checks auth state without prompting login.
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

/*
requireAuth()
Ensures the user is signed in, then runs the callback.
 */
export async function requireAuth<T>(op: (token: string) => Promise<T>): Promise<T> {
  const state = await ensureAuth();
  if (state.status != 'signed-in') throw new Error(AUTH_REQUIRED);
  return op(state.token);
}

/*
 observeAuthChanges()
 Fires when GitHub auth sessions change.
 */
export function observeAuthChanges(cb: () => void) {
  return vscode.authentication.onDidChangeSessions(e => {
    if (e.provider.id === PROVIDER) cb();
  });
}
