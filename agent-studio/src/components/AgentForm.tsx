"use client";

import { useState, useEffect } from "react";
import { Cpu, Shield, ShieldOff, Save, Wrench, Sparkles } from "lucide-react";

interface AgentFormProps {
  agent?: any;
  onSave: (agent: any) => void;
  onCancel?: () => void;
}

export default function AgentForm({ agent, onSave, onCancel }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || "");
  const [description, setDescription] = useState(agent?.description || "");
  const [systemPrompt, setSystemPrompt] = useState(
    agent?.systemPrompt ||
      "You are a helpful local AI agent capable of writing code, performing file operations, and using local tools to assist the user."
  );
  const [providerUrl, setProviderUrl] = useState(
    agent?.providerUrl || "http://localhost:11434"
  );
  const [model, setModel] = useState(agent?.model || "llama3");
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [sandboxingEnabled, setSandboxingEnabled] = useState(
    agent?.sandboxingEnabled ?? true
  );
  const [enabledTools, setEnabledTools] = useState<string[]>(
    agent?.tools || ["code_executor", "file_system", "web_fetcher", "memory"]
  );
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (agent) {
      setName(agent.name || "");
      setDescription(agent.description || "");
      setSystemPrompt(agent.systemPrompt || "");
      setProviderUrl(agent.providerUrl || "http://localhost:11434");
      setModel(agent.model || "llama3");
      setTemperature(agent.temperature ?? 0.7);
      setSandboxingEnabled(agent.sandboxingEnabled ?? true);
      setEnabledTools(agent.tools || []);
    } else {
      setName("");
      setDescription("");
      setSystemPrompt(
        "You are a helpful local AI agent capable of writing code, performing file operations, and using local tools to assist the user."
      );
      setProviderUrl("http://localhost:11434");
      setModel("llama3");
      setTemperature(0.7);
      setSandboxingEnabled(true);
      setEnabledTools(["code_executor", "file_system", "web_fetcher", "memory"]);
    }
  }, [agent]);

  useEffect(() => {
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => {
        if (data.tools) setAvailableTools(data.tools);
      })
      .catch((err) => console.error("Error fetching tools:", err));
  }, []);

  const toggleTool = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      setEnabledTools(enabledTools.filter((t) => t !== toolId));
    } else {
      setEnabledTools([...enabledTools, toolId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name,
      description,
      systemPrompt,
      providerUrl,
      model,
      temperature: parseFloat(String(temperature)),
      sandboxingEnabled,
      tools: enabledTools
    };

    try {
      const url = agent ? `/api/agents/${agent.id}` : "/api/agents";
      const method = agent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save agent");

      onSave(data.agent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold">{agent ? "Edit Custom Agent" : "Create New Custom Agent"}</h2>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Agent Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Local Code Reviewer"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Inspects code files and runs tests locally"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* System Instructions */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Instructions / System Prompt *</label>
        <textarea
          required
          rows={4}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Define how your agent behaves, its personality, constraints, and operational guidelines..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Local Provider Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Local LLM Endpoint URL</label>
          <input
            type="text"
            value={providerUrl}
            onChange={(e) => setProviderUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Ollama (11434) or LM Studio (1234/v1)</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Model Name</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama3"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">e.g. llama3, mistral, codellama</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Temperature ({temperature})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Lower = precise, Higher = creative</span>
        </div>
      </div>

      {/* Security & Sandboxing Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          {sandboxingEnabled ? (
            <Shield className="w-6 h-6 text-emerald-400" />
          ) : (
            <ShieldOff className="w-6 h-6 text-amber-500" />
          )}
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              Execution Sandboxing: {sandboxingEnabled ? <span className="text-emerald-400">ENABLED</span> : <span className="text-amber-500">DISABLED (UNSANDBOXED)</span>}
            </div>
            <p className="text-xs text-slate-400">
              {sandboxingEnabled
                ? "Restricts file access within workspace boundaries and disables unrestricted shell commands."
                : "Allows full local filesystem access and terminal shell execution. Use with trusted prompts."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSandboxingEnabled(!sandboxingEnabled)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            sandboxingEnabled
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900"
          }`}
        >
          Toggle {sandboxingEnabled ? "OFF" : "ON"}
        </button>
      </div>

      {/* Tool Selection Grid */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-indigo-400" /> Enabled Agent Capabilities & Tools
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableTools.map((t) => {
            const active = enabledTools.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggleTool(t.id)}
                className={`cursor-pointer p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  active
                    ? "bg-indigo-950/40 border-indigo-500 text-indigo-100"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {}}
                  className="mt-1 rounded border-slate-700 accent-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">{t.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving Agent..." : agent ? "Update Agent" : "Create Agent"}
        </button>
      </div>
    </form>
  );
}
