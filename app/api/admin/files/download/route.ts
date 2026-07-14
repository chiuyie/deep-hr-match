import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = new Set(["candidate-cvs", "job-jds"]);

export async function GET(request: NextRequest) {
  await requireRole("admin");

  const bucket = request.nextUrl.searchParams.get("bucket");
  const path = request.nextUrl.searchParams.get("path");

  if (!bucket || !path || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
