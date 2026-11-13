import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgentStep, AgentConfig, ChatMessageInput } from "@/lib/agentRunner";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Get or create session
    let session = sessionId
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: { orderBy: { createdAt: "asc" } } }
        })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          agentId: id,
          title: message.slice(0, 30) + (message.length > 30 ? "..." : "")
        },
        include: { messages: true }
      });
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message
      }
    });

    // Prepare full history for the agent engine
    const historyMessages: ChatMessageInput[] = session.messages.map((m) => ({
      role: m.role as any,
      content: m.content
    }));
    historyMessages.push({ role: "user", content: message });

    const agentConfig: AgentConfig = {
      id: agent.id,
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      providerUrl: agent.providerUrl,
      model: agent.model,
      temperature: agent.temperature,
      sandboxingEnabled: agent.sandboxingEnabled,
      enabledTools: JSON.parse(agent.tools || "[]")
    };

    // Run agent reasoning & tool execution loop
    const response = await runAgentStep(agentConfig, historyMessages);

    // Save assistant response to DB
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response.finalReply,
        toolCalls: response.steps.length > 0 ? JSON.stringify(response.steps) : null
      }
    });

    // Update session updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      sessionId: session.id,
      reply: response.finalReply,
      steps: response.steps,
      message: assistantMessage
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
