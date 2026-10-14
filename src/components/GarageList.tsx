'use client';

import React from 'react';

export interface GarageItemDto {
  id: number;
  productionYear: number;
  notes: string;
  carModel: {
    makeName: string;
    modelName: string;
    externalModelId: number;
  };
}

interface Props {
  items: GarageItemDto[];
  onRefresh: () => void;
}

export function GarageList({ items, onRefresh }: Props) {
  async function handleEdit(item: GarageItemDto) {
    const newYear = window.prompt('Nowy rocznik:', String(item.productionYear));
    if (newYear === null) return;
    const newNotes = window.prompt('Nowa notatka:', item.notes);
    if (newNotes === null) return;

    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productionYear: Number(newYear),
        notes: newNotes,
      }),
    });

    if (res.ok) onRefresh();
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  }

  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">2. Wirtualny Garaż (Baza PostgreSQL)</h2>
        <span className="text-xs text-gray-500">Liczba aut: {items.length}</span>
      </div>

      <div className="divide-y border rounded">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 text-center">Garaż jest pusty.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {item.carModel.makeName} {item.carModel.modelName} ({item.productionYear})
                </div>
                {item.notes && <div className="text-xs text-gray-600">{item.notes}</div>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="border px-2.5 py-1 rounded text-xs hover:bg-gray-100"
                >
                  Edytuj (PUT)
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="border border-red-500 text-red-600 px-2.5 py-1 rounded text-xs hover:bg-red-50"
                >
                  Usuń (DELETE)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}