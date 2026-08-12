'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type Log = { id: number; task: string; description: string | null; date: string; };
type Meal = { id: number; meal: string; date: string; };

export default function LogsMeals() {
  const [activeTab, setActiveTab] = useState<'meals' | 'logs'>('meals');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dateValue, setDateValue] = useState('');

  const fetchMeals = () => {
    fetch('/api/meals').then(res => res.json()).then(data => setMeals(data));
  };

  const fetchLogs = () => {
    fetch('/api/maintenance').then(res => res.json()).then(data => setLogs(data));
  };

  useEffect(() => {
    fetchMeals();
    fetchLogs();
   
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (activeTab === 'meals') {
      if (!dateValue) return;
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal: inputValue, date: dateValue }),
      });
      fetchMeals();
    } else {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: inputValue, description: '' }),
      });
      fetchLogs();
    }
    setInputValue('');
    setDateValue('');
  };

  return (
    <div className="bg-green-50/50 rounded-xl shadow-sm border border-green-100 p-6 h-full flex flex-col">
      <div className="flex gap-4 mb-4 border-b pb-2 border-green-200">
        <button 
          className={`font-bold text-lg ${activeTab === 'meals' ? 'text-green-700' : 'text-slate-400'}`}
          onClick={() => setActiveTab('meals')}
        >
          🍳 Meal Plan
        </button>
        <button 
          className={`font-bold text-lg ${activeTab === 'logs' ? 'text-green-700' : 'text-slate-400'}`}
          onClick={() => setActiveTab('logs')}
        >
          🔧 Maintenance
        </button>
      </div>

      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder={activeTab === 'meals' ? 'Meal description...' : 'Maintenance task...'} 
          className="flex-1 border border-green-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
        />
        {activeTab === 'meals' && (
          <input 
            type="date" 
            value={dateValue} 
            onChange={(e) => setDateValue(e.target.value)} 
            className="border border-green-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        )}
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Add</button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2">
        {activeTab === 'meals' ? (
          meals.length === 0 ? <p className="text-slate-500 text-sm">No meals planned.</p> :
          meals.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded border border-green-100 shadow-sm">
              <span className="font-medium text-slate-800">{item.meal}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{format(new Date(item.date), 'MMM d, yyyy')}</span>
            </div>
          ))
        ) : (
          logs.length === 0 ? <p className="text-slate-500 text-sm">No maintenance logged.</p> :
          logs.map(log => (
            <div key={log.id} className="flex justify-between items-center p-3 bg-white rounded border border-green-100 shadow-sm">
              <span className="font-medium text-slate-800">{log.task}</span>
              <span className="text-xs text-slate-500">{format(new Date(log.date), 'MMM d, yyyy')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
