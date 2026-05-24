import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/trades/[id]/stocks (Add stock)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const body = await req.json();
    const { name, quantity, buyPrice, currentPrice } = body;

    if (!name || quantity === undefined || buyPrice === undefined || currentPrice === undefined) {
      return NextResponse.json({ error: "Name, quantity, buyPrice, and currentPrice are required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const stock = await db.stock.create({
      data: {
        tradeId,
        name,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        currentPrice: parseFloat(currentPrice),
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "ADD_STOCK",
        details: `Added ${quantity} shares of "${name}" at buy price $${buyPrice} to "${trade.name}".`,
      },
    });

    return NextResponse.json({ stock }, { status: 201 });
  } catch (error: any) {
    console.error("POST stock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/trades/[id]/stocks (Update stock)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const body = await req.json();
    const { stockId, quantity, buyPrice, currentPrice } = body;

    if (!stockId) {
      return NextResponse.json({ error: "Stock ID is required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const currentStock = await db.stock.findUnique({
      where: { id: stockId },
    });

    if (!currentStock || currentStock.tradeId !== tradeId) {
      return NextResponse.json({ error: "Stock not found in this trade" }, { status: 404 });
    }

    const updatedData: any = {};
    if (quantity !== undefined) updatedData.quantity = parseFloat(quantity);
    if (buyPrice !== undefined) updatedData.buyPrice = parseFloat(buyPrice);
    if (currentPrice !== undefined) updatedData.currentPrice = parseFloat(currentPrice);

    const stock = await db.stock.update({
      where: { id: stockId },
      data: updatedData,
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "UPDATE_STOCK",
        details: `Updated "${stock.name}" in "${trade.name}": Qty to ${stock.quantity}, Buy to $${stock.buyPrice}, Current to $${stock.currentPrice}.`,
      },
    });

    return NextResponse.json({ stock });
  } catch (error: any) {
    console.error("PUT stock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/trades/[id]/stocks (Remove stock)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tradeId } = await context.params;
    const { searchParams } = new URL(req.url);
    const stockId = searchParams.get("stockId");

    if (!stockId) {
      return NextResponse.json({ error: "Stock ID is required" }, { status: 400 });
    }

    // Verify trade ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const currentStock = await db.stock.findUnique({
      where: { id: stockId },
    });

    if (!currentStock || currentStock.tradeId !== tradeId) {
      return NextResponse.json({ error: "Stock not found in this trade" }, { status: 404 });
    }

    await db.stock.delete({
      where: { id: stockId },
    });

    await db.auditLog.create({
      data: {
        userId,
        tradeId,
        action: "DELETE_STOCK",
        details: `Removed "${currentStock.name}" from "${trade.name}".`,
      },
    });

    return NextResponse.json({ message: "Stock deleted successfully" });
  } catch (error: any) {
    console.error("DELETE stock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
