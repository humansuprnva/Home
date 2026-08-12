'use client';

import { useState, useEffect } from 'react';

type ShoppingItem = { id: number; name: string; isBought: boolean; };
type InventoryItem = { id: number; name: string; quantity: number; location: string | null; };

export default function Lists() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'inventory'>('shopping');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');

  const fetchShopping = () => {
    fetch('/api/shopping').then(res => res.json()).then(data => setShoppingItems(data));
  };

  const fetchInventory = () => {
    fetch('/api/inventory').then(res => res.json()).then(data => setInventoryItems(data));
  };

  useEffect(() => {
    fetchShopping();
    fetchInventory();
   
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (activeTab === 'shopping') {
      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName }),
      });
      fetchShopping();
    } else {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, quantity: 1, location: '' }),
      });
      fetchInventory();
    }
    setNewItemName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col">
      <div className="flex gap-4 mb-4 border-b pb-2">
        <button 
          className={`font-bold text-lg ${activeTab === 'shopping' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => setActiveTab('shopping')}
        >
          🛒 Shopping
        </button>
        <button 
          className={`font-bold text-lg ${activeTab === 'inventory' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory
        </button>
      </div>

      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newItemName} 
          onChange={(e) => setNewItemName(e.target.value)} 
          placeholder={`Add to ${activeTab}...`} 
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded text-sm">+</button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2">
        {activeTab === 'shopping' ? (
          shoppingItems.length === 0 ? <p className="text-slate-500 text-sm">List is empty.</p> :
          shoppingItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
              <input type="checkbox" checked={item.isBought} readOnly className="w-4 h-4" />
              <span className={item.isBought ? 'line-through text-slate-400' : ''}>{item.name}</span>
            </div>
          ))
        ) : (
          inventoryItems.length === 0 ? <p className="text-slate-500 text-sm">Inventory is empty.</p> :
          inventoryItems.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2 border border-slate-100 bg-slate-50 rounded">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">Qty: {item.quantity}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
