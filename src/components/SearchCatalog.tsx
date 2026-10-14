'use client';

import React, { useState } from 'react';
import { NormalizedCarModel } from '@/lib/data-processor';

interface Props {
  onCarSaved: () => void;
}

export function SearchCatalog({ onCarSaved }: Props) {
  const [make, setMake] = useState('Honda');
  const [results, setResults] = useState<NormalizedCarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/external/models?make=${encodeURIComponent(make)}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Błąd pobierania danych');
        setResults([]);
      } else {
        setResults(json.data);
      }
    } catch {
      setError('Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToGarage(car: NormalizedCarModel) {
    const yearStr = window.prompt(`Podaj rocznik dla ${car.makeName} ${car.modelName}:`, '2004');
    if (yearStr === null) return;
    const notes = window.prompt('Dodatkowa notatka (opcjonalnie):', '') || '';

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...car,
        productionYear: Number(yearStr) || 2004,
        notes,
      }),
    });

    const json = await res.json();
    if (json.success) {
      onCarSaved();
    } else {
      alert(json.error || 'Nie udało się zapisać pojazdu.');
    }
  }

  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">1. Katalog NHTSA API (Wyszukiwarka)</h2>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Wpisz markę (np. Honda, Toyota, Audi)..."
          className="border rounded px-3 py-2 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Pobieranie...' : 'Szukaj w API'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto divide-y border rounded">
        {results.length === 0 && !loading && (
          <p className="p-4 text-sm text-gray-500 text-center">Brak wyników do wyświetlenia.</p>
        )}
        {results.map((car) => (
          <div
            key={car.externalModelId}
            className="p-3 flex items-center justify-between gap-2 text-sm"
          >
            <div>
              <span className="font-medium">{car.makeName}</span> {car.modelName}
              <span className="text-xs text-gray-400 ml-2">(ID: {car.externalModelId})</span>
            </div>
            <button
              onClick={() => handleAddToGarage(car)}
              className="border border-blue-600 text-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-50"
            >
              + Garaż
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}