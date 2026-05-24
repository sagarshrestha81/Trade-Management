import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { calculateTradeSummary } from "@/lib/calculations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/trades/[id]
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const trade = await db.trade.findFirst({
      where: { id, userId },
      include: {
        stocks: true,
        investors: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const summary = calculateTradeSummary(trade as any);

    return NextResponse.json({ trade: summary });
  } catch (error: any) {
    console.error("GET trade details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/trades/[id]
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, status, rolloverTargetTradeId } = body;

    const trade = await db.trade.findFirst({
      where: { id, userId },
      include: {
        stocks: true,
        investors: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Capture changes
    const updatedData: any = {};
    if (name) updatedData.name = name;
    
    // Check if status is changing to CLOSED
    if (status && status !== trade.status) {
      updatedData.status = status;
      
      if (status === "CLOSED") {
        // Calculate the final summary of the trade to close
        const currentSummary = calculateTradeSummary(trade as any);
        const finalProfit = currentSummary.totalProfit;
        updatedData.rolloverProfit = finalProfit;

        // Proportional profit rollover
        if (rolloverTargetTradeId && finalProfit > 0) {
          // Verify target trade exists and is owned by the user
          const targetTrade = await db.trade.findFirst({
            where: { id: rolloverTargetTradeId, userId, status: "ACTIVE" },
          });

          if (!targetTrade) {
            return NextResponse.json(
              { error: "Target active trade for rollover not found" },
              { status: 400 }
            );
          }

          // Distribute profits to each investor in the closed trade
          for (const investorSummary of currentSummary.investors) {
            if (investorSummary.profitShare > 0) {
              // Check if investor already exists in target trade (match by name)
              let targetInvestor = await db.investor.findFirst({
                where: { tradeId: rolloverTargetTradeId, name: investorSummary.name },
              });

              // Create investor if they don't exist in target trade
              if (!targetInvestor) {
                targetInvestor = await db.investor.create({
                  data: {
                    tradeId: rolloverTargetTradeId,
                    name: investorSummary.name,
                    investmentAmount: 0,
                  },
                });
              }

              // Create ROLLOVER transaction in target trade
              await db.transaction.create({
                data: {
                  tradeId: rolloverTargetTradeId,
                  investorId: targetInvestor.id,
                  amount: investorSummary.profitShare,
                  type: "ROLLOVER",
                  description: `Rollover Profit Share from "${trade.name}"`,
                },
              });

              // Update target investor's investmentAmount cache
              await db.investor.update({
                where: { id: targetInvestor.id },
                data: {
                  investmentAmount: {
                    increment: investorSummary.profitShare,
                  },
                },
              });
            }
          }

          // Create audit log for rollover
          await db.auditLog.create({
            data: {
              userId,
              tradeId: id,
              action: "ROLLOVER",
              details: `Closed trade "${trade.name}" and rolled over $${finalProfit} of profit to "${targetTrade.name}".`,
            },
          });
        }
      }
    }

    const updatedTrade = await db.trade.update({
      where: { id },
      data: updatedData,
      include: {
        stocks: true,
        investors: {
          include: {
            transactions: true,
          },
        },
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId: id,
        action: "UPDATE_TRADE",
        details: `Updated trade "${updatedTrade.name}". Status set to ${updatedTrade.status}.`,
      },
    });

    const summary = calculateTradeSummary(updatedTrade as any);

    return NextResponse.json({ trade: summary });
  } catch (error: any) {
    console.error("PUT trade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/trades/[id]
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const trade = await db.trade.findFirst({
      where: { id, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    await db.trade.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "DELETE_TRADE",
        details: `Deleted trade "${trade.name}".`,
      },
    });

    return NextResponse.json({ message: "Trade deleted successfully" });
  } catch (error: any) {
    console.error("DELETE trade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
