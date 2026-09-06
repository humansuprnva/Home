import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { sessions: true } }
      }
    });

    const formatted = agents.map((agent) => ({
      ...agent,
      tools: JSON.parse(agent.tools || "[]")
    }));

    return NextResponse.json({ agents: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      systemPrompt,
      providerUrl,
      model,
      temperature,
      sandboxingEnabled,
      tools
    } = body;

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: "Name and systemPrompt are required." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || "",
        systemPrompt,
        providerUrl: providerUrl || "http://localhost:11434",
        model: model || "llama3",
        temperature: typeof temperature === "number" ? temperature : 0.7,
        sandboxingEnabled: sandboxingEnabled ?? true,
        tools: JSON.stringify(Array.isArray(tools) ? tools : ["code_executor", "file_system"])
      }
    });

    return NextResponse.json({
      agent: {
        ...agent,
        tools: JSON.parse(agent.tools)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
