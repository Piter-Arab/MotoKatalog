import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@motokatalog.pl' },
    update: {},
    create: {
      email: 'demo@motokatalog.pl',
      name: 'Użytkownik Testowy',
    },
  });

  const accord = await prisma.carModel.upsert({
    where: { externalModelId: 1861 },
    update: {},
    create: {
      externalMakeId: 474,
      makeName: 'Honda',
      externalModelId: 1861,
      modelName: 'Accord',
    },
  });

  const civic = await prisma.carModel.upsert({
    where: { externalModelId: 1863 },
    update: {},
    create: {
      externalMakeId: 474,
      makeName: 'Honda',
      externalModelId: 1863,
      modelName: 'Civic',
    },
  });

  await prisma.garageItem.createMany({
    data: [
      {
        userId: user.id,
        carModelId: accord.id,
        productionYear: 2004,
        notes: '2.0 i-VTEC K20A6, wersja Tourer Executive',
      },
      {
        userId: user.id,
        carModelId: civic.id,
        productionYear: 2006,
        notes: 'Auto testowe w bazie',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seedowanie zakończone pomyślnie.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });