import { prisma } from "../src/lib/prisma";
import { TOOLS } from "../src/lib/tools";
import { runAgentStep } from "../src/lib/agentRunner";

describe("Agent Studio Local Environment Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Local Database & Agent CRUD", () => {
    let createdAgentId: string;

    test("Creates custom agent in local database", async () => {
      const agent = await prisma.agent.create({
        data: {
          name: "Test Local Agent",
          description: "A test agent created in automated tests",
          systemPrompt: "You are a test assistant.",
          providerUrl: "http://localhost:11434",
          model: "llama3",
          temperature: 0.5,
          sandboxingEnabled: true,
          tools: JSON.stringify(["code_executor", "file_system", "memory"])
        }
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe("Test Local Agent");
      createdAgentId = agent.id;
    });

    test("Reads created agent from local database", async () => {
      const agent = await prisma.agent.findUnique({
        where: { id: createdAgentId }
      });

      expect(agent).not.toBeNull();
      expect(agent?.model).toBe("llama3");
    });

    test("Deletes created test agent", async () => {
      await prisma.agent.delete({
        where: { id: createdAgentId }
      });

      const found = await prisma.agent.findUnique({
        where: { id: createdAgentId }
      });
      expect(found).toBeNull();
    });
  });

  describe("Local Tools Execution & Sandboxing Enforcement", () => {
    test("Code Executor tool works in sandboxed mode without leaking process/fs", async () => {
      const result = await TOOLS.code_executor.execute(
        { code: "const val = 15 + 27; console.log('Math result:', val); return val;" },
        { sandboxingEnabled: true }
      );

      expect(result.success).toBe(true);
      expect(result.output).toBe(42);
      expect(result.logs).toContain("Math result: 42");
    });

    test("Code Executor tool executes unsandboxed mode with full Node scope", async () => {
      const result = await TOOLS.code_executor.execute(
        { code: "console.log(typeof process); return process.platform;" },
        { sandboxingEnabled: false }
      );

      expect(result.success).toBe(true);
      expect(result.output).toBe(process.platform);
    });

    test("File System tool writes and reads files inside workspace", async () => {
      const testFilePath = "test_data/sample.txt";
      const writeRes = await TOOLS.file_system.execute(
        { action: "write", filePath: testFilePath, content: "Hello Local Agent" },
        { sandboxingEnabled: true, workspaceDir: process.cwd() }
      );
      expect(writeRes.success).toBe(true);

      const readRes = await TOOLS.file_system.execute(
        { action: "read", filePath: testFilePath },
        { sandboxingEnabled: true, workspaceDir: process.cwd() }
      );
      expect(readRes.success).toBe(true);
      expect(readRes.content).toBe("Hello Local Agent");
    });

    test("File System tool blocks path traversal outside workspace when sandboxing is ON", async () => {
      const res = await TOOLS.file_system.execute(
        { action: "read", filePath: "../../../etc/passwd" },
        { sandboxingEnabled: true, workspaceDir: process.cwd() }
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Access denied");
    });

    test("Shell Command tool is blocked when sandboxing is ON", async () => {
      const res = await TOOLS.shell_cmd.execute(
        { command: "echo test" },
        { sandboxingEnabled: true }
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("disabled when sandboxing is ON");
    });

    test("Shell Command tool executes when sandboxing is OFF", async () => {
      const res = await TOOLS.shell_cmd.execute(
        { command: "echo 'hello from shell'" },
        { sandboxingEnabled: false }
      );

      expect(res.success).toBe(true);
      expect(res.stdout).toBe("hello from shell");
    });

    test("Persistent Memory tool stores and retrieves key-value entries", async () => {
      const storeRes = await TOOLS.memory.execute(
        { action: "store", key: "agent_mode", value: "autonomous" },
        { sandboxingEnabled: true }
      );
      expect(storeRes.success).toBe(true);

      const getRes = await TOOLS.memory.execute(
        { action: "retrieve", key: "agent_mode" },
        { sandboxingEnabled: true }
      );
      expect(getRes.success).toBe(true);
      expect(getRes.value).toBe("autonomous");
    });
  });

  describe("Agent Execution Engine Turn Loop", () => {
    test("Runs agent step and handles tool execution", async () => {
      const agent = {
        id: "agent-test-1",
        name: "Test Runner Agent",
        systemPrompt: "You are an assistant.",
        providerUrl: "http://localhost:11434",
        model: "llama3",
        temperature: 0.7,
        sandboxingEnabled: true,
        enabledTools: ["code_executor", "file_system", "memory"]
      };

      const response = await runAgentStep(agent, [
        { role: "user", content: "Run code to calculate 100 * 5" }
      ]);

      expect(response.finalReply).toBeDefined();
      expect(response.updatedMessages.length).toBeGreaterThan(1);
    });
  });
});
