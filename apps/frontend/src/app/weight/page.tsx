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

    return (
        <div className="p-6 max-w-xl mx-auto">
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
                <>
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
                        <Tooltip />
                    </LineChart>
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
