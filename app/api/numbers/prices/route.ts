import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { smsbus } from "@/lib/smsbus";
import { getPricingSettings, priceOtpInr } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countryIdRaw = searchParams.get("country_id");
    if (countryIdRaw === null || countryIdRaw === "") {
      return NextResponse.json({ success: false, error: "country_id is required" }, { status: 400 });
    }

    const countryId = Number(countryIdRaw);
    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ success: false, error: "Invalid country_id" }, { status: 400 });
    }

    const [pricesResult, projectsResult, settings] = await Promise.all([
      smsbus.getPrices(countryId),
      smsbus.getProjects(),
      getPricingSettings(),
    ]);

    if (pricesResult.code !== 200 || !pricesResult.data) {
      return NextResponse.json({ success: true, data: pricesResult });
    }

    const projectMap: Record<number, { title: string; code: string }> = {};
    if (projectsResult.code === 200 && projectsResult.data) {
      for (const p of Object.values(projectsResult.data)) {
        projectMap[p.id] = { title: p.title, code: p.code };
      }
    }

    const enriched: Record<string, {
      country_id: number;
      project_id: number;
      /** USD from SMS-BUS (activation price) */
      cost_usd: number;
      /** INR charged to wallet (FX + admin markups) */
      cost: number;
      total_count: number;
      country_title: string;
      country_code: string;
      project_title: string;
      project_code: string;
    }> = {};

    for (const [key, price] of Object.entries(pricesResult.data)) {
      const project = projectMap[price.project_id];
      const usd = price.cost;
      const inr = priceOtpInr(settings, usd, price.project_id);
      enriched[key] = {
        country_id: price.country_id,
        project_id: price.project_id,
        cost_usd: usd,
        cost: inr,
        total_count: price.total_count,
        country_title: price.title,
        country_code: price.code,
        project_title: project?.title ?? `Service #${price.project_id}`,
        project_code: project?.code ?? "",
      };
    }

    return NextResponse.json({
      success: true,
      data: { code: 200, message: "Operation Success", data: enriched },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
