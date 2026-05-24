import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { calculateTradeSummary } from "@/lib/calculations";

// GET /api/trades
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
      orderBy: { createdAt: "desc" },
    });

    const summaries = trades.map((trade) => calculateTradeSummary(trade as any));

    return NextResponse.json({ trades: summaries });
  } catch (error: any) {
    console.error("GET trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/trades
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, ownerInitialDeposit } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Trade name is required" }, { status: 400 });
    }

    // 1. Create trade
    const trade = await db.trade.create({
      data: {
        name,
        userId,
      },
    });

    // 2. Create default owner investor
    const ownerName = "Owner (You)";
    const investor = await db.investor.create({
      data: {
        tradeId: trade.id,
        name: ownerName,
        investmentAmount: ownerInitialDeposit || 0,
      },
    });

    // 3. Create initial transaction if deposit > 0
    if (ownerInitialDeposit && ownerInitialDeposit > 0) {
      await db.transaction.create({
        data: {
          tradeId: trade.id,
          investorId: investor.id,
          amount: ownerInitialDeposit,
          type: "DEPOSIT",
          description: "Initial Capital Contribution",
        },
      });

      await db.auditLog.create({
        data: {
          userId,
          tradeId: trade.id,
          action: "CREATE_TRADE",
          details: `Created trade "${name}" with initial capital of $${ownerInitialDeposit} from Owner (You).`,
        },
      });
    } else {
      await db.auditLog.create({
        data: {
          userId,
          tradeId: trade.id,
          action: "CREATE_TRADE",
          details: `Created trade "${name}" with zero initial capital.`,
        },
      });
    }

    // Fetch full created trade to calculate and return
    const fullTrade = await db.trade.findUnique({
      where: { id: trade.id },
      include: {
        stocks: true,
        investors: {
          include: {
            transactions: true,
          },
        },
      },
    });

    const summary = calculateTradeSummary(fullTrade as any);

    return NextResponse.json({ trade: summary }, { status: 201 });
  } catch (error: any) {
    console.error("POST trade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
