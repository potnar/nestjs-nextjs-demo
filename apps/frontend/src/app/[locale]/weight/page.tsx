'use client';

import { formatDate } from '@/utils/formatDate';
import type { TooltipProps } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';

interface Entry {
    id?: string; // Identyfikator wpisu, opcjonalny, jeśli nie jest zwracany z backendu
    date: string;
    weight: number;
}



// Funkcja pomocnicza do obliczania tygodniowych średnich
function getWeeklyAverages(entries: Entry[]) {
    if (entries.length === 0) return [];

    // Sortuj wpisy rosnąco po dacie
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sorted[0].date);

    // Ustal pierwszy poniedziałek (lub dzień pierwszego wpisu, jeśli to poniedziałek)
    const firstDayOfWeek = new Date(firstDate);
    const day = firstDayOfWeek.getDay();
    // 0 = niedziela, 1 = poniedziałek, ..., 6 = sobota
    // Jeśli nie poniedziałek, cofnij do poniedziałku
    if (day !== 1) {
        // Jeśli niedziela (0), cofnij o 6 dni, w przeciwnym razie o (day - 1)
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    }

    // Grupowanie po tygodniach od pierwszego wpisu
    const weekMap: Record<number, { sum: number; count: number; start: Date }> = {};
    entries.forEach(entry => {
        const d = new Date(entry.date);
        // Oblicz numer tygodnia względem pierwszego poniedziałku
        const diffDays = Math.floor((d.getTime() - firstDayOfWeek.getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(diffDays / 7);
        if (!weekMap[weekNum]) {
            const weekStart = new Date(firstDayOfWeek);
            weekStart.setDate(firstDayOfWeek.getDate() + weekNum * 7);
            weekMap[weekNum] = { sum: 0, count: 0, start: weekStart };
        }
        weekMap[weekNum].sum += entry.weight;
        weekMap[weekNum].count += 1;
    });

    return Object.entries(weekMap)
        .map(([weekNum, { sum, count, start }]) => ({
            weekLabel: `Tydzień ${Number(weekNum) + 1}`,
            average: +(sum / count).toFixed(2),
            date: start.toISOString().split('T')[0],
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function WeightPage() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState(() =>
        new Date().toISOString().split('T')[0]
    );
    const [page, setPage] = useState(1);
    const [limit] = useState(10); // Można później zrobić edytowalne
    const [total, setTotal] = useState(0);
    const [allEntries, setAllEntries] = useState<Entry[]>([]);

    useEffect(() => {
        fetch(`http://localhost:3001/weight/all`)
            .then(res => res.json())
            .then(all => {
                const sorted = [...all].sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                setAllEntries(sorted);
            });
    }, []);

    useEffect(() => {
        fetch(`http://localhost:3001/weight?page=${page}&limit=${limit}`)
            .then(res => res.json())
            .then(result => {
                const sorted = [...result.data].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setEntries(sorted);
                setTotal(result.total);
            })
            .catch(console.error);
    }, [page, limit]);

    const addEntry = async () => {
        if (!weight) return;

        const existing = allEntries.some(e => e.date === date);
        if (existing) {
            alert('Wpis dla tej daty już istnieje.');
            return;
        }

        const newEntry = { date, weight: parseFloat(weight) };

        let saved: Entry = newEntry;
        try {
            const res = await fetch('http://localhost:3001/weight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry),
        });

        if (res.ok) {
            const body = await res.json().catch(() => null);
            if (body && (body.id || body.date)) saved = { ...newEntry, ...body };
          } else {
            // fallback tymczasowy id (np. do czasu kolejnego refetch)
            saved = { ...newEntry, id: `${newEntry.date}-${newEntry.weight}` };
          }
        }catch{
            saved = { ...newEntry, id: `${newEntry.date}-${newEntry.weight}` };
        }
        setEntries(prev =>
            [...prev, saved].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        
          // dane do wykresu — rosnąco po dacie (ważne!)
          setAllEntries(prev =>
            [...prev, saved].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        
          setWeight("");
    };


    const deleteEntry = async (idToDelete: string) => {
        await fetch(`http://localhost:3001/weight/${idToDelete}`, {
            method: 'DELETE',
        });

        setEntries(prev => prev.filter(entry => entry.id !== idToDelete));
        setAllEntries(prev => prev.filter(entry => entry.id !== idToDelete));
    };

    const weeklyAverages = useMemo(() => getWeeklyAverages(allEntries), [allEntries]);


    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border rounded shadow text-sm text-blue-700">
                    <div style={{ color: '#000' }}>
                        <strong>Data:</strong> {formatDate(label as string)}
                    </div>
                    {payload[0].dataKey === 'weight' ? (
                        <div style={{ color: '#000' }}>
                            <strong>Waga:</strong> {payload[0].value} kg
                        </div>
                    ) : (
                        <div style={{ color: '#000' }}>
                            <strong>Średnia:</strong> {payload[0].value} kg
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">⚖️ Moja Waga</h1>
            <div className="flex gap-4 mb-4">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border px-2 py-1"
                />
                <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Waga (kg)"
                    className="border px-2 py-1"
                />
                <button onClick={addEntry} className="bg-blue-500 text-white px-4 py-1 rounded">
                    Dodaj
                </button>
            </div>
            {entries.length > 0 && (
                <div className="flex flex-col md:flex-row gap-8">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Dzienny wykres</h2>
                        <LineChart
                            width={600}
                            height={300}
                            data={allEntries}
                            margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                        >
                            <Line type="monotone" dataKey="weight" stroke="#8884d8" />
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                        </LineChart>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Średnia tygodniowa</h2>
                        <LineChart
                            width={600}
                            height={300}
                            data={weeklyAverages}
                            margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                        >
                            <Line type="monotone" dataKey="average" stroke="#82ca9d" />
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                        </LineChart>
                    </div>
                </div>
            )}

            {entries.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-6 mb-2">Wpisy</h2>
                    <ul className="space-y-2">
                        {entries.map((entry, i) => (
                            <li
                            key={entry.id ?? `${entry.date}-${entry.weight}`}
                                className="grid grid-cols-2 w-full items-center border-b pb-1"
                            >
                                <span className="text-gray-700 flex items-center">
                                    <span className="font-semibold mr-1 w-10 inline-block text-left">
                                        {(page - 1) * limit + i + 1}.
                                    </span>
                                    {formatDate(entry.date)} — {entry.weight} kg
                                </span>
                                <button
                                    className="text-red-500 justify-self-end"
                                    onClick={() => entry.id && deleteEntry(entry.id)}
                                >
                                    Usuń
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* PAGINATION */}
                    <div className="flex justify-center gap-4 mt-4 items-center">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                            ⬅️ Poprzednia
                        </button>

                        <span>
                            Strona {page} z {Math.ceil(total / limit)}
                        </span>

                        <button
                            onClick={() =>
                                setPage(prev => (prev < Math.ceil(total / limit) ? prev + 1 : prev))
                            }
                            disabled={page >= Math.ceil(total / limit)}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Następna ➡️
                        </button>
                    </div>
                </>
            )}

        </div>
    );
}
