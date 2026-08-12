import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const meals = await prisma.mealPlan.findMany({
      orderBy: { date: 'asc' },
      where: { date: { gte: new Date() } }
    });
    return NextResponse.json(meals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { meal, date } = await request.json();
    const mealPlan = await prisma.mealPlan.create({
      data: { meal, date: new Date(date) },
    });
    return NextResponse.json(mealPlan);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add meal plan' }, { status: 500 });
  }
}
