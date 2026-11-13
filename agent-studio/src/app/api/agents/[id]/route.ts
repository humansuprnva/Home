import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { updatedAt: "desc" },
          take: 10
        }
      }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        ...agent,
        tools: JSON.parse(agent.tools || "[]")
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(providerUrl !== undefined && { providerUrl }),
        ...(model !== undefined && { model }),
        ...(temperature !== undefined && { temperature }),
        ...(sandboxingEnabled !== undefined && { sandboxingEnabled }),
        ...(tools !== undefined && { tools: JSON.stringify(tools) })
      }
    });

    return NextResponse.json({
      agent: {
        ...updated,
        tools: JSON.parse(updated.tools || "[]")
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await prisma.agent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
