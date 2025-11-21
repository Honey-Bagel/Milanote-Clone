import { getBoardBreadcrumbs } from "@/lib/data/board-breadcrumbs";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ error: "Board ID required" }, { status: 400 });
	}

	const breadcrumbs = await getBoardBreadcrumbs(id);
	return NextResponse.json(breadcrumbs);
}
