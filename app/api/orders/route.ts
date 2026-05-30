import { NextResponse } from "next/server";
import { getOperationsData } from "@/lib/excelData";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const payload = await getOperationsData();
  return NextResponse.json(payload);
}
