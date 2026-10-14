import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { isValidRawRecord } from '@/lib/data-processor';

export async function GET() {
  try {
    const items = await prisma.garageItem.findMany({
      include: {
        carModel: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(items, 200);
  } catch {
    return apiError('Nie udało się pobrać listy pojazdów z bazy danych.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalMakeId, makeName, externalModelId, modelName, productionYear, notes } = body;

    if (
      !isValidRawRecord({
        Make_ID: externalMakeId,
        Make_Name: makeName,
        Model_ID: externalModelId,
        Model_Name: modelName,
      })
    ) {
      return apiError('Nieprawidłowe dane modelu pojazdu.', 400);
    }

    const parsedYear = Number(productionYear) || 2000;
    if (parsedYear < 1900 || parsedYear > 2027) {
      return apiError('Rocznik pojazdu musi mieścić się w przedziale 1900-2027.', 400);
    }

    const defaultUser = await prisma.user.upsert({
      where: { email: 'demo@motokatalog.pl' },
      update: {},
      create: { email: 'demo@motokatalog.pl', name: 'Użytkownik Testowy' },
    });

    const carModel = await prisma.carModel.upsert({
      where: { externalModelId: Number(externalModelId) },
      update: {},
      create: {
        externalMakeId: Number(externalMakeId),
        makeName: String(makeName).trim(),
        externalModelId: Number(externalModelId),
        modelName: String(modelName).trim(),
      },
    });

    const createdItem = await prisma.garageItem.create({
      data: {
        userId: defaultUser.id,
        carModelId: carModel.id,
        productionYear: parsedYear,
        notes: typeof notes === 'string' ? notes.trim() : '',
      },
      include: { carModel: true },
    });

    return apiSuccess(createdItem, 201);
  } catch {
    return apiError('Błąd podczas zapisywania pojazdu w bazie danych.', 500);
  }
}