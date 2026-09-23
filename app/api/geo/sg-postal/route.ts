import { NextResponse } from "next/server";
import { isSingaporePostalCode, parseOneMapSearch } from "@/lib/geo/sg-postal";

export const runtime = "nodejs";

const ONE_MAP_SEARCH = "https://www.onemap.gov.sg/api/common/elastic/search";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!isSingaporePostalCode(code)) {
    return NextResponse.json({ address: null });
  }

  const url = new URL(ONE_MAP_SEARCH);
  url.searchParams.set("searchVal", code);
  url.searchParams.set("returnGeom", "N");
  url.searchParams.set("getAddrDetails", "Y");
  url.searchParams.set("pageNum", "1");

  const headers: HeadersInit = {};
  const token = process.env.ONEMAP_ACCESS_TOKEN?.trim();
  if (token) headers.Authorization = token;

  try {
    const response = await fetch(url, { headers, next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) {
      return NextResponse.json(
        { address: null, error: "Address lookup is unavailable right now." },
        { status: 502 }
      );
    }
    const payload = (await response.json()) as unknown;
    const lookup = parseOneMapSearch(payload, code);
    if (!lookup) {
      return NextResponse.json({ address: null });
    }
    return NextResponse.json({ address: lookup.address, postalCode: lookup.postalCode });
  } catch {
    return NextResponse.json(
      { address: null, error: "Address lookup is unavailable right now." },
      { status: 502 }
    );
  }
}
