'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Container } from '@/components/Container';
import { SearchCatalog } from '@/components/SearchCatalog';
import { GarageList, GarageItemDto } from '@/components/GarageList';

export default function HomePage() {
  const [garageItems, setGarageItems] = useState<GarageItemDto[]>([]);

  const loadGarage = useCallback(async () => {
    try {
      const res = await fetch('/api/items');
      const json = await res.json();
      if (json.success) {
        setGarageItems(json.data);
      }
    } catch {
      console.error('Błąd ładowania garażu');
    }
  }, []);

  useEffect(() => {
    loadGarage();
  }, [loadGarage]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Container>
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">MotoKatalog</h1>
          <p className="text-sm text-gray-600">
            Etap II: Integracja NHTSA API, czyszczenie danych i CRUD na PostgreSQL (Docker)
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SearchCatalog onCarSaved={loadGarage} />
          <GarageList items={garageItems} onRefresh={loadGarage} />
        </div>
      </Container>
    </main>
  );
}