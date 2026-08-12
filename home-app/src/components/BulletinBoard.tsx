'use client';

import { useState, useEffect } from 'react';

type Note = {
  id: number;
  content: string;
};

export default function BulletinBoard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');

  const fetchNotes = () => {
    fetch('/api/notes').then(res => res.json()).then(data => setNotes(data));
  };

  useEffect(() => {
    fetchNotes();

  }, []);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    setContent('');
    fetchNotes();
  };

  return (
    <div className="bg-yellow-50/50 rounded-xl shadow-sm border border-yellow-200 p-6 h-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-800">
        <span>📌</span> Bulletin Board
      </h2>

      <form onSubmit={addNote} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot something down..."
          className="w-full border border-yellow-300 bg-white/80 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 min-h-[80px]"
        />
        <button type="submit" className="w-full mt-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded text-sm font-medium hover:bg-yellow-500">Post Note</button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-slate-500 text-sm italic">Board is empty.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="p-3 bg-yellow-100 rounded-sm shadow-sm rotate-1 font-mono text-sm border border-yellow-200">
              {note.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
