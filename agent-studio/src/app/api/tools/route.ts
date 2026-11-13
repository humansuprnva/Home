import { NextResponse } from "next/server";
import { TOOLS } from "@/lib/tools";

export async function GET() {
  const toolList = Object.values(TOOLS).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));
  return NextResponse.json({ tools: toolList });
}
