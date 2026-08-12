'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string;
};

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const fetchEvents = () => {
    fetch('/api/events').then(res => res.json()).then(data => setEvents(data));
  };

  useEffect(() => {
    fetchEvents();
   
  }, []);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date }),
    });
    
    setTitle('');
    setDate('');
    fetchEvents();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 h-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>📅</span> Calendar
      </h2>
      
      <form onSubmit={addEvent} className="mb-6 flex gap-2">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="New Event..." 
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <input 
          type="datetime-local" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">Add</button>
      </form>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No upcoming events.</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="p-3 border rounded-lg bg-slate-50 flex flex-col gap-1">
              <div className="font-medium text-slate-800">{event.title}</div>
              <div className="text-xs text-slate-500 font-mono">
                {format(new Date(event.date), 'MMM d, yyyy - h:mm a')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
