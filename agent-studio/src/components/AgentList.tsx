"use client";

import { Bot, Plus, Trash2, Edit3, MessageSquare, ShieldCheck, ShieldAlert } from "lucide-react";

interface AgentListProps {
  agents: any[];
  selectedAgentId?: string;
  onSelectAgent: (agent: any) => void;
  onEditAgent: (agent: any) => void;
  onNewAgent: () => void;
  onDeleteAgent: (id: string) => void;
}

export default function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onEditAgent,
  onNewAgent,
  onDeleteAgent
}: AgentListProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold">Custom Agents</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
            {agents.length}
          </span>
        </div>
        <button
          onClick={onNewAgent}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No custom agents created yet. Click "New Agent" to build one!
          </div>
        ) : (
          agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-slate-800/90 border-indigo-500/80 shadow-md"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectAgent(agent)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">
                        {agent.name}
                      </span>
                      {agent.sandboxingEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" /> Sandbox
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                          <ShieldAlert className="w-3 h-3" /> Unsandboxed
                        </span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {agent.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Model: <span className="font-mono text-slate-300">{agent.model}</span></span>
                      <span>Tools: <span className="text-indigo-300">{(agent.tools || []).length}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => onSelectAgent(agent)}
                      title="Open Chat"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditAgent(agent)}
                      title="Edit Agent Config"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAgent(agent.id)}
                      title="Delete Agent"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
