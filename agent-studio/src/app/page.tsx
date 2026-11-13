"use client";

import { useState, useEffect } from "react";
import AgentList from "@/components/AgentList";
import AgentForm from "@/components/AgentForm";
import AgentChat from "@/components/AgentChat";
import { Bot, Sparkles, Cpu, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.agents) {
        setAgents(data.agents);
        if (data.agents.length > 0 && !selectedAgent && !isCreating && !editingAgent) {
          setSelectedAgent(data.agents[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSaved = (savedAgent: any) => {
    fetchAgents();
    setSelectedAgent(savedAgent);
    setIsCreating(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (selectedAgent?.id === id) {
        setSelectedAgent(null);
      }
      fetchAgents();
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <Cpu className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Agent Studio
            </h1>
            <p className="text-xs text-slate-400">Locally Hosted Custom Agent Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Local Execution & Persistent Storage Active</span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Column: Agent Selection & List */}
        <div className="lg:col-span-4 xl:col-span-3 h-[calc(100vh-120px)]">
          <AgentList
            agents={agents}
            selectedAgentId={selectedAgent?.id}
            onSelectAgent={(agent) => {
              setSelectedAgent(agent);
              setIsCreating(false);
              setEditingAgent(null);
            }}
            onEditAgent={(agent) => {
              setEditingAgent(agent);
              setIsCreating(false);
            }}
            onNewAgent={() => {
              setIsCreating(true);
              setEditingAgent(null);
            }}
            onDeleteAgent={handleDeleteAgent}
          />
        </div>

        {/* Right Column: Visual Form or Interactive Agent Chat */}
        <div className="lg:col-span-8 xl:col-span-9 h-[calc(100vh-120px)] overflow-y-auto">
          {isCreating || editingAgent ? (
            <AgentForm
              agent={editingAgent}
              onSave={handleAgentSaved}
              onCancel={() => {
                setIsCreating(false);
                setEditingAgent(null);
              }}
            />
          ) : selectedAgent ? (
            <AgentChat
              agent={selectedAgent}
              onEdit={() => setEditingAgent(selectedAgent)}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4 shadow-xl">
              <Bot className="w-16 h-16 text-slate-700" />
              <h3 className="text-lg font-bold text-slate-200">No Agent Selected</h3>
              <p className="text-sm max-w-md text-slate-400">
                Select an existing custom agent from the left sidebar or click below to create a new local AI agent.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" /> Create Custom Agent
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
