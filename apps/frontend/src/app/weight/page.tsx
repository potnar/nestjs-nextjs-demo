'use client';

import { formatDate } from '@/utils/formatDate';
import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';

interface Entry {
    date: string;
    weight: number;
}

function getISOWeek(date: Date) {
    const tmp = new Date(date.getTime());
    tmp.setHours(0, 0, 0, 0);
    // Czwartek w tym samym tygodniu
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
    // 1 stycznia
    const week1 = new Date(tmp.getFullYear(), 0, 4);
    // Liczba dni od 1 stycznia do czwartku
    return (
        1 +
        Math.round(
            ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        )
    );
}

// Data początku tygodnia ISO
function getStartOfISOWeek(year: number, week: number) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
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

    useEffect(() => {
        fetch('http://localhost:3001/weight')
            .then(res => res.json())
            .then(data => {
                const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setEntries(sorted);
            })
            .catch(console.error);
    }, []);

    const addEntry = async () => {
        if (!weight) return;

        const existing = entries.find(e => e.date === date);
        if (existing) {
            alert('Wpis dla tej daty już istnieje.');
            return;
        }

        const newEntry = { date, weight: parseFloat(weight) };

        await fetch('http://localhost:3001/weight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry),
        });

        const updated = [...entries, newEntry].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEntries(updated);
        setWeight('');
    };

    const deleteEntry = async (dateToDelete: string) => {
        await fetch(`http://localhost:3001/weight/${dateToDelete}`, {
            method: 'DELETE',
        });

        setEntries(prev => prev.filter(entry => entry.date !== dateToDelete));
    };

    const weeklyAverages = getWeeklyAverages(entries);

    // Własny tooltip z czytelną datą
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border rounded shadow text-sm text-blue-700">
                    <div style={{ color: '#000' }}>
                        <strong>Data:</strong> {formatDate(label)}
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
                    {/* Wykres dzienny */}
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Dzienny wykres</h2>
                        <LineChart
                            width={600}
                            height={300}
                            data={entries}
                            margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                        >
                            <Line type="monotone" dataKey="weight" stroke="#8884d8" />
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                        </LineChart>
                    </div>
                    {/* Wykres tygodniowy */}
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
                        {entries.map(entry => (
                            <li key={entry.date} className="flex justify-between items-center border-b pb-1">
                                <span>{formatDate(entry.date)} — {entry.weight} kg</span>
                                <button
                                    className="text-red-500"
                                    onClick={() => deleteEntry(entry.date)}
                                >
                                    Usuń
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
