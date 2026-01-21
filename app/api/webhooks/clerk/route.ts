import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const payload: WebhookEvent = await req.json();
	console.log(payload);

	return NextResponse.json({ payload: payload });
}

export async function GET() {
	return NextResponse.json({ message: "Hello world" });
}