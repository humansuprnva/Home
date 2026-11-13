"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Wrench, ChevronDown, ChevronRight, Terminal, RefreshCw, Cpu, ShieldCheck, ShieldAlert } from "lucide-react";

interface AgentChatProps {
  agent: any;
  onEdit: () => void;
}

export default function AgentChat({ agent, onEdit }: AgentChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent?.id) {
      fetchSessions(agent.id);
    }
  }, [agent?.id]);

  const fetchSessions = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/sessions`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0) {
          selectSession(data.sessions[0]);
        } else {
          startNewSession();
        }
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const selectSession = (session: any) => {
    setSessionId(session.id);
    setMessages(session.messages || []);
  };

  const startNewSession = async () => {
    if (!agent?.id) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Session" })
      });
      const data = await res.json();
      if (data.session) {
        setSessionId(data.session.id);
        setMessages([]);
        setSessions([data.session, ...sessions]);
      }
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !agent?.id) return;

    const userText = input;
    setInput("");
    setLoading(true);

    const tempUserMsg = { role: "user", content: userText, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          sessionId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error running agent chat");

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMsg = {
        role: "assistant",
        content: data.reply,
        toolCalls: data.steps && data.steps.length > 0 ? JSON.stringify(data.steps) : null,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `[Error executing agent step]: ${err.message}`,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpand = (index: number) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full shadow-xl overflow-hidden text-slate-100">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/80 border border-indigo-800/80 rounded-xl">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base">{agent.name}</h2>
              {agent.sandboxingEnabled ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" /> Sandbox ON
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                  <ShieldAlert className="w-3 h-3" /> Sandbox OFF
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span>Endpoint: <span className="font-mono text-slate-300">{agent.providerUrl}</span></span>
              <span>Model: <span className="font-mono text-slate-300">{agent.model}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startNewSession}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Session
          </button>
          <button
            onClick={onEdit}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Edit Agent
          </button>
        </div>
      </div>

      {/* Main Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-3 py-12">
            <Cpu className="w-12 h-12 text-slate-700" />
            <p className="text-sm">
              Agent is ready! Ask a question or request a task like running code, inspecting files, or saving memory.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
              <button
                onClick={() => setInput("Write a function to calculate Fibonacci numbers and execute it")}
                className="text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 px-2.5 py-1.5 rounded-lg"
              >
                "Execute Fibonacci JS code"
              </button>
              <button
                onClick={() => setInput("List files in the current workspace directory")}
                className="text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 px-2.5 py-1.5 rounded-lg"
              >
                "List files in workspace"
              </button>
              <button
                onClick={() => setInput("Store key 'project_goal' with value 'Build local agent platform' in persistent memory")}
                className="text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 px-2.5 py-1.5 rounded-lg"
              >
                "Save persistent memory"
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            let toolSteps = null;
            if (msg.toolCalls) {
              try {
                toolSteps = typeof msg.toolCalls === "string" ? JSON.parse(msg.toolCalls) : msg.toolCalls;
              } catch {
                toolSteps = null;
              }
            }

            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                        : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                  </div>

                  {/* Tool Call Step Accordion */}
                  {toolSteps && Array.isArray(toolSteps) && toolSteps.length > 0 && (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2 text-xs text-slate-300 font-mono">
                      <button
                        onClick={() => toggleStepExpand(idx)}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 w-full text-left font-sans font-semibold"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Executed Tool Steps ({toolSteps.length})</span>
                        {expandedSteps[idx] ? (
                          <ChevronDown className="w-4 h-4 ml-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>

                      {expandedSteps[idx] && (
                        <div className="mt-2 space-y-2 border-t border-slate-800/80 pt-2">
                          {toolSteps.map((step: any, sIdx: number) => (
                            <div key={sIdx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                              {step.toolCall && (
                                <div className="space-y-1">
                                  <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5" />
                                    Tool Call: {step.toolCall.toolId}
                                  </div>
                                  <pre className="text-[11px] bg-slate-950 p-2 rounded text-slate-300 overflow-x-auto">
                                    {JSON.stringify(step.toolCall.args, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {step.toolResult && (
                                <div className="mt-1.5 space-y-1">
                                  <div className="text-emerald-400 font-bold">Tool Output:</div>
                                  <pre className="text-[11px] bg-slate-950 p-2 rounded text-emerald-300 overflow-x-auto">
                                    {JSON.stringify(step.toolResult, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${agent.name} or give instructions...`}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shrink-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
