import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

// Helper to recalculate and cache investor net investment
async function updateInvestorInvestmentCache(investorId: string) {
  const transactions = await db.transaction.findMany({
    where: { investorId },
  });

  let netInvestment = 0;
  transactions.forEach((t) => {
    netInvestment += t.amount;
  });

  await db.investor.update({
    where: { id: investorId },
    data: { investmentAmount: netInvestment },
  });
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tradeId, investorId, amount, type, description, date } = await req.json();

    if (!tradeId || !investorId || amount === undefined || !type) {
      return NextResponse.json({ error: "TradeId, investorId, amount, and type are required" }, { status: 400 });
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
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    // Standardize amount: deposits/rollovers are positive, withdrawals are negative
    let finalAmount = parseFloat(amount);
    if (type === "WITHDRAWAL" && finalAmount > 0) {
      finalAmount = -finalAmount;
    } else if (type === "DEPOSIT" && finalAmount < 0) {
      finalAmount = Math.abs(finalAmount);
    }

    const transaction = await db.transaction.create({
      data: {
        tradeId,
        investorId,
        amount: finalAmount,
        type,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Update investor cache
    await updateInvestorInvestmentCache(investorId);

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "TRANSACTION",
        details: `Recorded ${type} of $${Math.abs(finalAmount)} for "${investor.name}" in "${trade.name}".`,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error("POST transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/transactions
export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, amount, type, description, date } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const currentTx = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        trade: true,
        investor: true,
      },
    });

    if (!currentTx || currentTx.trade.userId !== userId) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updatedData: any = {};
    const finalType = type || currentTx.type;

    if (amount !== undefined) {
      let finalAmount = parseFloat(amount);
      if (finalType === "WITHDRAWAL" && finalAmount > 0) {
        finalAmount = -finalAmount;
      } else if (finalType === "DEPOSIT" && finalAmount < 0) {
        finalAmount = Math.abs(finalAmount);
      }
      updatedData.amount = finalAmount;
    }
    
    if (type) updatedData.type = type;
    if (description !== undefined) updatedData.description = description;
    if (date) updatedData.date = new Date(date);

    const transaction = await db.transaction.update({
      where: { id: transactionId },
      data: updatedData,
    });

    // Update investor cache
    await updateInvestorInvestmentCache(currentTx.investorId);

    await db.auditLog.create({
      data: {
        userId,
        tradeId: currentTx.tradeId,
        action: "UPDATE_TRANSACTION",
        details: `Updated transaction for "${currentTx.investor.name}" in "${currentTx.trade.name}".`,
      },
    });

    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error("PUT transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/transactions
export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const currentTx = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        trade: true,
        investor: true,
      },
    });

    if (!currentTx || currentTx.trade.userId !== userId) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await db.transaction.delete({
      where: { id: transactionId },
    });

    // Update investor cache
    await updateInvestorInvestmentCache(currentTx.investorId);

    await db.auditLog.create({
      data: {
        userId,
        tradeId: currentTx.tradeId,
        action: "DELETE_TRANSACTION",
        details: `Deleted transaction (${currentTx.type} of $${Math.abs(currentTx.amount)}) for "${currentTx.investor.name}" in "${currentTx.trade.name}".`,
      },
    });

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error: any) {
    console.error("DELETE transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
