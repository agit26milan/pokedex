import { create, isAxiosError } from 'axios';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export const api = create({
  baseURL: POKEAPI_BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

export function describeApiError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'Request timed out.';
    if (error.response) return `PokéAPI responded with ${error.response.status}.`;
    return 'PokéAPI is unreachable.';
  }
  return 'Unexpected error while contacting PokéAPI.';
}
