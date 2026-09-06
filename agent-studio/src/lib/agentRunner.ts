import { TOOLS, ToolDefinition } from "./tools";

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  providerUrl: string; // e.g. http://localhost:11434 or http://localhost:1234/v1
  model: string;
  temperature: number;
  sandboxingEnabled: boolean;
  enabledTools: string[]; // array of tool IDs
}

export interface ChatMessageInput {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCalls?: any;
  toolResults?: any;
}

export interface AgentResponse {
  finalReply: string;
  steps: {
    thought?: string;
    toolCall?: { toolId: string; args: any };
    toolResult?: any;
  }[];
  updatedMessages: ChatMessageInput[];
}

export async function runAgentStep(
  agent: AgentConfig,
  history: ChatMessageInput[],
  maxTurns = 5
): Promise<AgentResponse> {
  const activeTools = agent.enabledTools
    .map((id) => TOOLS[id])
    .filter((t): t is ToolDefinition => Boolean(t));

  const messages = [...history];
  const steps: AgentResponse["steps"] = [];

  // Build tool instructions prompt for local LLMs
  const toolDescriptions = activeTools.map((t) => ({
    name: t.id,
    description: t.description,
    parameters: t.parameters
  }));

  const systemToolInstruction = activeTools.length > 0
    ? `\n\nYou have access to the following local tools:\n` +
      JSON.stringify(toolDescriptions, null, 2) +
      `\n\nTo use a tool, reply ONLY with a JSON object in the following format:\n` +
      `{\n  "tool": "tool_id",\n  "args": { ... }\n}\n` +
      `When you have your final response or no tools are needed, reply directly with normal text.`
    : "";

  // Ensure system prompt is present
  const fullSystemPrompt = agent.systemPrompt + systemToolInstruction;
  if (messages.length === 0 || messages[0].role !== "system") {
    messages.unshift({ role: "system", content: fullSystemPrompt });
  } else {
    messages[0] = { role: "system", content: fullSystemPrompt };
  }

  let turn = 0;
  while (turn < maxTurns) {
    turn++;
    const assistantContent = await callLocalLLM(agent, messages, activeTools);

    // Check if assistant wants to call a tool
    const toolCall = parseToolCall(assistantContent, activeTools);

    if (toolCall) {
      steps.push({
        thought: assistantContent,
        toolCall: { toolId: toolCall.tool, args: toolCall.args }
      });

      const toolDef = TOOLS[toolCall.tool];
      let result: any;
      if (toolDef) {
        try {
          result = await toolDef.execute(toolCall.args, {
            sandboxingEnabled: agent.sandboxingEnabled,
            workspaceDir: process.cwd()
          });
        } catch (err: any) {
          result = { success: false, error: err.message || String(err) };
        }
      } else {
        result = { success: false, error: `Tool ${toolCall.tool} not found or disabled.` };
      }

      steps.push({ toolResult: result });

      messages.push({
        role: "assistant",
        content: JSON.stringify(toolCall)
      });

      messages.push({
        role: "user",
        content: `TOOL_RESULT for ${toolCall.tool}:\n` + JSON.stringify(result, null, 2)
      });
    } else {
      // Final response obtained
      messages.push({
        role: "assistant",
        content: assistantContent
      });

      return {
        finalReply: assistantContent,
        steps,
        updatedMessages: messages
      };
    }
  }

  const timeoutReply = "Agent reached maximum tool call iterations.";
  messages.push({ role: "assistant", content: timeoutReply });
  return {
    finalReply: timeoutReply,
    steps,
    updatedMessages: messages
  };
}

function parseToolCall(text: string, activeTools: ToolDefinition[]): { tool: string; args: any } | null {
  const activeToolIds = new Set(activeTools.map((t) => t.id));

  // Match JSON blocks ```json ... ``` or inline JSON
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*"tool"[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && typeof parsed.tool === "string" && activeToolIds.has(parsed.tool)) {
        return { tool: parsed.tool, args: parsed.args || {} };
      }
    } catch {
      // parsing failed
    }
  }

  // Fallback direct JSON parsing
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && typeof parsed.tool === "string" && activeToolIds.has(parsed.tool)) {
      return { tool: parsed.tool, args: parsed.args || {} };
    }
  } catch {
    // not JSON
  }

  return null;
}

async function callLocalLLM(
  agent: AgentConfig,
  messages: ChatMessageInput[],
  tools: ToolDefinition[]
): Promise<string> {
  const baseUrl = agent.providerUrl.replace(/\/+$/, "");

  // 1. Try OpenAI-compatible endpoint (LM Studio / vLLM / LocalAI / Ollama v1 API)
  if (baseUrl.includes("/v1") || baseUrl.includes(":1234") || baseUrl.includes("openai")) {
    try {
      const endpoint = baseUrl.endsWith("/v1") ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: agent.model,
          temperature: agent.temperature,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch (err) {
      console.warn("OpenAI compatible call failed, trying Ollama native endpoint...", err);
    }
  }

  // 2. Try Ollama Native `/api/chat` or `/api/generate`
  try {
    const ollamaEndpoint = `${baseUrl}/api/chat`;
    const res = await fetch(ollamaEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agent.model,
        temperature: agent.temperature,
        stream: false,
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data.message?.content || "";
    }
  } catch (err) {
    // Fallback if local LLM server is offline/unreachable
  }

  // Mock / Local Fallback response if local LLM is unreachable during testing/offline run
  return mockLocalLLMResponse(messages, tools);
}

function mockLocalLLMResponse(messages: ChatMessageInput[], tools: ToolDefinition[]): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (lastUserMsg.includes("TOOL_RESULT")) {
    return `[Local Agent]: Processed tool result successfully. Summary of output:\n${lastUserMsg}`;
  }

  if (lastUserMsg.toLowerCase().includes("run code") || lastUserMsg.toLowerCase().includes("execute")) {
    const codeTool = tools.find((t) => t.id === "code_executor");
    if (codeTool) {
      return JSON.stringify({
        tool: "code_executor",
        args: { code: "const a = 10; const b = 20; log('Sum is:', a + b); a + b;" }
      });
    }
  }

  if (lastUserMsg.toLowerCase().includes("read file") || lastUserMsg.toLowerCase().includes("write file") || lastUserMsg.toLowerCase().includes("list files")) {
    const fsTool = tools.find((t) => t.id === "file_system");
    if (fsTool) {
      return JSON.stringify({
        tool: "file_system",
        args: { action: "list", filePath: "." }
      });
    }
  }

  if (lastUserMsg.toLowerCase().includes("memory") || lastUserMsg.toLowerCase().includes("store")) {
    const memTool = tools.find((t) => t.id === "memory");
    if (memTool) {
      return JSON.stringify({
        tool: "memory",
        args: { action: "store", key: "favorite_color", value: "blue" }
      });
    }
  }

  if (lastUserMsg.toLowerCase().includes("shell") || lastUserMsg.toLowerCase().includes("command")) {
    const shellTool = tools.find((t) => t.id === "shell_cmd");
    if (shellTool) {
      return JSON.stringify({
        tool: "shell_cmd",
        args: { command: "echo 'Hello from local shell'" }
      });
    }
  }

  return `[Local Agent]: Hello! I am configured with model response handling. (Note: To connect real local LLM, start Ollama or LM Studio at configured provider URL). Received message: "${lastUserMsg}"`;
}
