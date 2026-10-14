import { processAndCleanVehicleData, ProcessingResult } from './data-processor';

interface CacheEntry {
  timestamp: number;
  data: ProcessingResult;
}

const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 503
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

export async function fetchModelsByMake(makeQuery: string): Promise<ProcessingResult & { fromCache: boolean }> {
  const sanitizedMake = makeQuery.trim().toLowerCase();

  if (!sanitizedMake || sanitizedMake.length < 2) {
    throw new ExternalApiError('Nazwa marki musi zawierać co najmniej 2 znaki.', 400);
  }

  const cached = apiCache.get(sanitizedMake);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  const endpoint = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(
    sanitizedMake
  )}?format=json`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new ExternalApiError(
        `Zewnętrzne API NHTSA zwróciło błąd HTTP: ${response.status}`,
        response.status >= 500 ? 503 : response.status
      );
    }

    const payload = await response.json();

    if (!payload || !Array.isArray(payload.Results)) {
      throw new ExternalApiError('Nieprawidłowa struktura odpowiedzi z zewnętrznego API.', 502);
    }

    const processed = processAndCleanVehicleData(payload.Results);

    apiCache.set(sanitizedMake, {
      timestamp: Date.now(),
      data: processed,
    });

    return { ...processed, fromCache: false };
  } catch (error) {
    if (error instanceof ExternalApiError) {
      throw error;
    }
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ExternalApiError('Przekroczono czas oczekiwania na odpowiedź zewnętrznego API (Timeout 5s).', 504);
    }
    throw new ExternalApiError('Zewnętrzne API NHTSA jest obecnie niedostępne.', 503);
  }
}