export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'sc_token';
const USER_KEY = 'sc_user';

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function messageForStatus(status: number) {
  if (status === 400 || status === 422) return 'Please review the information you entered and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested information could not be found.';
  if (status === 409) return 'This time slot is no longer available. Please select another slot.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  return 'We could not complete your request. Please try again.';
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : null;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(url, { ...options, headers }); }
  catch { throw new ApiError('Unable to reach the server. Please check your connection and try again.'); }
  const data = await readJson(response).catch(() => null);
  if (!response.ok) {
    if (response.status === 401) { clearStoredSession(); window.dispatchEvent(new Event('sc:auth-expired')); }
    throw new ApiError(messageForStatus(response.status), response.status);
  }
  return data as T;
}
