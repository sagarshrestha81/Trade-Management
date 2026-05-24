import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/trades/[id]/investors (Add investor with initial deposit)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const body = await req.json();
    const { name, initialDeposit } = body;

    if (!name || initialDeposit === undefined) {
      return NextResponse.json({ error: "Investor name and initial deposit are required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Check if investor with same name already exists in this trade
    const existingInvestor = await db.investor.findFirst({
      where: { tradeId, name },
    });

    if (existingInvestor) {
      return NextResponse.json({ error: "An investor with this name already exists in this trade" }, { status: 400 });
    }

    // Create investor
    const investor = await db.investor.create({
      data: {
        tradeId,
        name,
        investmentAmount: parseFloat(initialDeposit),
      },
    });

    // Create initial transaction if deposit > 0
    if (parseFloat(initialDeposit) > 0) {
      await db.transaction.create({
        data: {
          tradeId,
          investorId: investor.id,
          amount: parseFloat(initialDeposit),
          type: "DEPOSIT",
          description: "Initial Capital Contribution",
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "ADD_INVESTOR",
        details: `Added investor "${name}" with capital of $${initialDeposit} to "${trade.name}".`,
      },
    });

    return NextResponse.json({ investor }, { status: 201 });
  } catch (error: any) {
    console.error("POST investor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/trades/[id]/investors (Update investor name)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const body = await req.json();
    const { investorId, name } = body;

    if (!investorId || !name) {
      return NextResponse.json({ error: "Investor ID and name are required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const currentInvestor = await db.investor.findUnique({
      where: { id: investorId },
    });

    if (!currentInvestor || currentInvestor.tradeId !== tradeId) {
      return NextResponse.json({ error: "Investor not found in this trade" }, { status: 404 });
    }

    const updatedInvestor = await db.investor.update({
      where: { id: investorId },
      data: { name },
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "UPDATE_INVESTOR",
        details: `Renamed investor from "${currentInvestor.name}" to "${name}" in "${trade.name}".`,
      },
    });

    return NextResponse.json({ investor: updatedInvestor });
  } catch (error: any) {
    console.error("PUT investor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/trades/[id]/investors (Remove investor)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");

    if (!investorId) {
      return NextResponse.json({ error: "Investor ID is required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const investor = await db.investor.findUnique({
      where: { id: investorId },
    });

    if (!investor || investor.tradeId !== tradeId) {
      return NextResponse.json({ error: "Investor not found in this trade" }, { status: 404 });
    }

    await db.investor.delete({
      where: { id: investorId },
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "DELETE_INVESTOR",
        details: `Removed investor "${investor.name}" and all associated transactions from "${trade.name}".`,
      },
    });

    return NextResponse.json({ message: "Investor deleted successfully" });
  } catch (error: any) {
    console.error("DELETE investor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
