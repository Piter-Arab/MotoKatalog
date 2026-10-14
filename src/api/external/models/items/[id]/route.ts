import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const itemId = Number(id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return apiError('Nieprawidłowy identyfikator rekordu.', 400);
  }

  try {
    const item = await prisma.garageItem.findUnique({
      where: { id: itemId },
      include: { carModel: true },
    });

    if (!item) {
      return apiError('Nie znaleziono pojazdu o podanym ID.', 404);
    }

    return apiSuccess(item, 200);
  } catch {
    return apiError('Błąd podczas pobierania szczegółów pojazdu.', 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const itemId = Number(id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return apiError('Nieprawidłowy identyfikator rekordu.', 400);
  }

  try {
    const body = await request.json();
    const { productionYear, notes } = body;

    const existing = await prisma.garageItem.findUnique({ where: { id: itemId } });
    if (!existing) {
      return apiError('Nie znaleziono pojazdu do aktualizacji.', 404);
    }

    const parsedYear = productionYear !== undefined ? Number(productionYear) : existing.productionYear;
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2027) {
      return apiError('Nieprawidłowy rocznik pojazdu.', 400);
    }

    const updated = await prisma.garageItem.update({
      where: { id: itemId },
      data: {
        productionYear: parsedYear,
        notes: typeof notes === 'string' ? notes.trim() : existing.notes,
      },
      include: { carModel: true },
    });

    return apiSuccess(updated, 200);
  } catch {
    return apiError('Błąd podczas aktualizacji pojazdu.', 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const itemId = Number(id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return apiError('Nieprawidłowy identyfikator rekordu.', 400);
  }

  try {
    const existing = await prisma.garageItem.findUnique({ where: { id: itemId } });
    if (!existing) {
      return apiError('Nie znaleziono pojazdu do usunięcia.', 404);
    }

    await prisma.garageItem.delete({ where: { id: itemId } });
    return apiSuccess({ deletedId: itemId }, 200);
  } catch {
    return apiError('Błąd podczas usuwania pojazdu z bazy.', 500);
  }
}