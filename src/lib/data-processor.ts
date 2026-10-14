export interface RawNhtsaRecord {
  Make_ID?: unknown;
  Make_Name?: unknown;
  Model_ID?: unknown;
  Model_Name?: unknown;
}

export interface NormalizedCarModel {
  externalMakeId: number;
  makeName: string;
  externalModelId: number;
  modelName: string;
}

export interface ProcessingResult {
  validRecords: NormalizedCarModel[];
  rejectedCount: number;
}

function normalizeMakeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 3) return trimmed.toUpperCase(); // np. BMW, KIA
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function isValidRawRecord(record: RawNhtsaRecord): boolean {
  if (!record || typeof record !== 'object') return false;

  const makeId = Number(record.Make_ID);
  const modelId = Number(record.Model_ID);
  const makeName = typeof record.Make_Name === 'string' ? record.Make_Name.trim() : '';
  const modelName = typeof record.Model_Name === 'string' ? record.Model_Name.trim() : '';

  return (
    Number.isInteger(makeId) &&
    makeId > 0 &&
    Number.isInteger(modelId) &&
    modelId > 0 &&
    makeName.length > 0 &&
    modelName.length > 0
  );
}

export function processAndCleanVehicleData(rawList: unknown[]): ProcessingResult {
  if (!Array.isArray(rawList)) {
    return { validRecords: [], rejectedCount: 0 };
  }

  const seenModelIds = new Set<number>();
  const validRecords: NormalizedCarModel[] = [];
  let rejectedCount = 0;

  for (const item of rawList) {
    const raw = item as RawNhtsaRecord;

    if (!isValidRawRecord(raw)) {
      rejectedCount++;
      continue;
    }

    const externalModelId = Number(raw.Model_ID);

    if (seenModelIds.has(externalModelId)) {
      rejectedCount++;
      continue;
    }
    seenModelIds.add(externalModelId);

    validRecords.push({
      externalMakeId: Number(raw.Make_ID),
      makeName: normalizeMakeName(String(raw.Make_Name ?? 'Nieznana')),
      externalModelId,
      modelName: String(raw.Model_Name ?? 'Nieznany').trim().replace(/\s+/g, ' '),
    });
  }

  validRecords.sort((a, b) => a.modelName.localeCompare(b.modelName));

  return { validRecords, rejectedCount };
}