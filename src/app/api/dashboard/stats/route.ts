import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { calculateTradeSummary, calculateAggregatedStats } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trades = await db.trade.findMany({
      where: { userId },
      include: {
        stocks: true,
        investors: {
          include: {
            transactions: true,
          },
        },
      },
    });

    const summaries = trades.map((trade) => calculateTradeSummary(trade as any));
    const stats = calculateAggregatedStats(summaries);

    // Fetch the recent 10 audit logs to show in the dashboard
    const auditLogs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ stats, auditLogs });
  } catch (error: any) {
    console.error("GET dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
