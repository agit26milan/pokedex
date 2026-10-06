import axios from 'axios';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/** Single axios instance for the app. PokéAPI needs no key, only a sane timeout. */
export const api = axios.create({
  baseURL: POKEAPI_BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

/** Turns any axios failure into one short line the UI can show without leaking internals. */
export function describeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'Request timed out.';
    if (error.response) return `PokéAPI responded with ${error.response.status}.`;
    return 'PokéAPI is unreachable.';
  }
  return 'Unexpected error while contacting PokéAPI.';
}
