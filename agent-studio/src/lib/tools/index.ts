import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import vm from "vm";

const execPromise = util.promisify(exec);

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: { sandboxingEnabled: boolean; workspaceDir?: string }) => Promise<any>;
}

function prepareCode(code: string): string {
  const trimmed = code.trim();
  if (trimmed.includes("return ") || trimmed.includes(";")) {
    return trimmed.includes("return ") ? trimmed : `${trimmed};`;
  }
  return `return (${trimmed});`;
}

export const TOOLS: Record<string, ToolDefinition> = {
  code_executor: {
    id: "code_executor",
    name: "Code Executor",
    description: "Executes JavaScript code. Can run in isolated secure sandbox or full Node environment.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript code snippet to execute" }
      },
      required: ["code"]
    },
    execute: async ({ code }: { code: string }, { sandboxingEnabled }) => {
      const execCode = prepareCode(code);

      if (sandboxingEnabled) {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => String(a)).join(" ")),
            error: (...args: any[]) => logs.push("[error] " + args.map(a => String(a)).join(" ")),
            warn: (...args: any[]) => logs.push("[warn] " + args.map(a => String(a)).join(" "))
          };

          const sandbox = {
            console: customConsole,
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            RegExp,
            parseInt,
            parseFloat,
            isNaN
          };

          const context = vm.createContext(sandbox);
          const script = new vm.Script(`(function() { ${execCode} })()`);
          const result = script.runInContext(context, { timeout: 2000 });
          return { success: true, logs, output: result !== undefined ? result : "Execution finished" };
        } catch (err: any) {
          return { success: false, error: err.message || String(err) };
        }
      } else {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => String(a)).join(" ")),
            error: (...args: any[]) => logs.push("[error] " + args.map(a => String(a)).join(" ")),
            warn: (...args: any[]) => logs.push("[warn] " + args.map(a => String(a)).join(" "))
          };

          const sandbox = {
            console: customConsole,
            fs,
            path,
            process,
            fetch,
            Buffer,
            setTimeout,
            clearTimeout,
            Math,
            Date,
            JSON
          };

          const context = vm.createContext(sandbox);
          const script = new vm.Script(`(function() { ${execCode} })()`);
          const result = script.runInContext(context, { timeout: 5000 });
          return { success: true, logs, output: result !== undefined ? result : "Execution finished" };
        } catch (err: any) {
          return { success: false, error: err.message || String(err) };
        }
      }
    }
  },

  file_system: {
    id: "file_system",
    name: "File System Operations",
    description: "Read, write, list, or check existence of local files.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["read", "write", "list", "exists"], description: "Action to perform" },
        filePath: { type: "string", description: "Path to file or directory" },
        content: { type: "string", description: "Content to write (if action is write)" }
      },
      required: ["action", "filePath"]
    },
    execute: async ({ action, filePath, content }: { action: string; filePath: string; content?: string }, { sandboxingEnabled, workspaceDir }) => {
      const baseDir = workspaceDir || process.cwd();
      const resolvedPath = path.resolve(baseDir, filePath);

      if (sandboxingEnabled && !resolvedPath.startsWith(baseDir)) {
        return { success: false, error: "Access denied: Path outside workspace boundary in sandboxed mode." };
      }

      try {
        if (action === "read") {
          const data = fs.readFileSync(/*turbopackIgnore: true*/ resolvedPath, "utf-8");
          return { success: true, content: data };
        } else if (action === "write") {
          fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(resolvedPath), { recursive: true });
          fs.writeFileSync(/*turbopackIgnore: true*/ resolvedPath, content || "", "utf-8");
          return { success: true, message: `File written successfully to ${filePath}` };
        } else if (action === "list") {
          const files = fs.readdirSync(/*turbopackIgnore: true*/ resolvedPath);
          return { success: true, files };
        } else if (action === "exists") {
          const exists = fs.existsSync(/*turbopackIgnore: true*/ resolvedPath);
          return { success: true, exists };
        } else {
          return { success: false, error: `Unsupported action: ${action}` };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  },

  web_fetcher: {
    id: "web_fetcher",
    name: "Web Fetcher",
    description: "Fetches JSON or text content from local or external HTTP endpoints.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"], description: "HTTP method" },
        headers: { type: "object", description: "Request headers" },
        body: { type: "string", description: "Request body string" }
      },
      required: ["url"]
    },
    execute: async ({ url, method = "GET", headers = {}, body }: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? body : undefined
        });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        return {
          success: res.ok,
          status: res.status,
          data: json || text
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  },

  shell_cmd: {
    id: "shell_cmd",
    name: "Shell Command Runner",
    description: "Executes a shell command in the local terminal environment.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to execute" }
      },
      required: ["command"]
    },
    execute: async ({ command }: { command: string }, { sandboxingEnabled }) => {
      if (sandboxingEnabled) {
        return {
          success: false,
          error: "Shell commands are disabled when sandboxing is ON for safety. Disable sandboxing in agent settings to enable shell command execution."
        };
      }

      try {
        const { stdout, stderr } = await execPromise(command, { timeout: 15000 });
        return {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
          stderr: err.stderr ? err.stderr.trim() : undefined
        };
      }
    }
  },

  memory: {
    id: "memory",
    name: "Persistent Memory Store",
    description: "Store and retrieve local facts, key-value memory, or session context.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["store", "retrieve", "list"], description: "Memory action" },
        key: { type: "string", description: "Key name" },
        value: { type: "string", description: "Value to store" }
      },
      required: ["action"]
    },
    execute: async ({ action, key, value }: { action: string; key?: string; value?: string }) => {
      const memFilePath = path.join(process.cwd(), "agent_memory_store.json");
      let store: Record<string, string> = {};
      if (fs.existsSync(/*turbopackIgnore: true*/ memFilePath)) {
        try {
          store = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ memFilePath, "utf-8"));
        } catch {
          store = {};
        }
      }

      if (action === "store" && key) {
        store[key] = value || "";
        fs.writeFileSync(/*turbopackIgnore: true*/ memFilePath, JSON.stringify(store, null, 2), "utf-8");
        return { success: true, message: `Stored '${key}' in agent memory.` };
      } else if (action === "retrieve" && key) {
        return { success: true, key, value: store[key] || null };
      } else if (action === "list") {
        return { success: true, memoryKeys: Object.keys(store), memory: store };
      } else {
        return { success: false, error: "Invalid parameters for memory action" };
      }
    }
  }
};
