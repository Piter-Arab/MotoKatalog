import { NextRequest } from 'next/server';
import { fetchModelsByMake, ExternalApiError } from '@/lib/nhtsa-api';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get('make') || '';

  try {
    const result = await fetchModelsByMake(make);
    return apiSuccess(result.validRecords, 200, {
      count: result.validRecords.length,
      rejectedCount: result.rejectedCount,
      fromCache: result.fromCache,
    });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return apiError(error.message, error.statusCode);
    }
    return apiError('Wewnętrzny błąd serwera podczas komunikacji z zewnętrznym API.', 500);
  }
}