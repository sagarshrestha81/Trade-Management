import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.investor.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating test user...");
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("password123", salt);

  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "test@test.com",
      passwordHash,
    },
  });

  console.log("Creating Trade 1 (Closed Trade)...");
  const trade1 = await prisma.trade.create({
    data: {
      userId: user.id,
      name: "Trade 1 (Closed Portfolio)",
      status: "CLOSED",
      rolloverProfit: 2000,
    },
  });

  // Create investors for Trade 1
  const owner1 = await prisma.investor.create({
    data: { tradeId: trade1.id, name: "Owner (You)", investmentAmount: 5000 },
  });
  const usha1 = await prisma.investor.create({
    data: { tradeId: trade1.id, name: "Usha", investmentAmount: 3000 },
  });
  const mom1 = await prisma.investor.create({
    data: { tradeId: trade1.id, name: "Mom", investmentAmount: 2000 },
  });

  // Create transactions for Trade 1
  await prisma.transaction.createMany({
    data: [
      { tradeId: trade1.id, investorId: owner1.id, amount: 5000, type: "DEPOSIT", description: "Initial Capital", date: new Date("2026-01-10") },
      { tradeId: trade1.id, investorId: usha1.id, amount: 3000, type: "DEPOSIT", description: "Initial Capital", date: new Date("2026-01-10") },
      { tradeId: trade1.id, investorId: mom1.id, amount: 2000, type: "DEPOSIT", description: "Initial Capital", date: new Date("2026-01-10") },
    ],
  });

  // Create stocks for Trade 1 (which are closed out)
  await prisma.stock.createMany({
    data: [
      { tradeId: trade1.id, name: "Apple Inc. (AAPL)", quantity: 20, buyPrice: 200, currentPrice: 250 }, // +1000 profit
      { tradeId: trade1.id, name: "Tesla Inc. (TSLA)", quantity: 20, buyPrice: 200, currentPrice: 250 }, // +1000 profit
    ],
  });

  console.log("Creating Trade 2 (Active Portfolio)...");
  const trade2 = await prisma.trade.create({
    data: {
      userId: user.id,
      name: "Trade 2 (Active Tech Portfolio)",
      status: "ACTIVE",
      rolloverFromTradeId: trade1.id,
    },
  });

  // Create investors for Trade 2
  const owner2 = await prisma.investor.create({
    data: { tradeId: trade2.id, name: "Owner (You)", investmentAmount: 5000 }, // 1000 rollover + 4000 cash
  });
  const usha2 = await prisma.investor.create({
    data: { tradeId: trade2.id, name: "Usha", investmentAmount: 3000 }, // 600 rollover + 2400 cash
  });
  const mom2 = await prisma.investor.create({
    data: { tradeId: trade2.id, name: "Mom", investmentAmount: 2000 }, // 400 rollover + 1600 cash
  });

  // Create transactions for Trade 2 (both rollovers and new capital)
  await prisma.transaction.createMany({
    data: [
      // Rollovers from Trade 1 profits
      { tradeId: trade2.id, investorId: owner2.id, amount: 1000, type: "ROLLOVER", description: "Rollover Profit from Trade 1", date: new Date("2026-04-01") },
      { tradeId: trade2.id, investorId: usha2.id, amount: 600, type: "ROLLOVER", description: "Rollover Profit from Trade 1", date: new Date("2026-04-01") },
      { tradeId: trade2.id, investorId: mom2.id, amount: 400, type: "ROLLOVER", description: "Rollover Profit from Trade 1", date: new Date("2026-04-01") },
      
      // New capital deposits
      { tradeId: trade2.id, investorId: owner2.id, amount: 4000, type: "DEPOSIT", description: "Added Capital for Tech Portfolio", date: new Date("2026-04-02") },
      { tradeId: trade2.id, investorId: usha2.id, amount: 2400, type: "DEPOSIT", description: "Added Capital for Tech Portfolio", date: new Date("2026-04-02") },
      { tradeId: trade2.id, investorId: mom2.id, amount: 1600, type: "DEPOSIT", description: "Added Capital for Tech Portfolio", date: new Date("2026-04-02") },
    ],
  });

  // Create stocks for Trade 2 (active)
  await prisma.stock.createMany({
    data: [
      { tradeId: trade2.id, name: "Microsoft Corp (MSFT)", quantity: 15, buyPrice: 300, currentPrice: 350 }, // +750 profit
      { tradeId: trade2.id, name: "Nvidia Corp (NVDA)", quantity: 20, buyPrice: 200, currentPrice: 280 }, // +1600 profit
    ],
  });

  console.log("Writing audit logs...");
  await prisma.auditLog.createMany({
    data: [
      { userId: user.id, tradeId: trade1.id, action: "CREATE_TRADE", details: "Created Trade 1 (Closed Portfolio) with initial investor deposits of $10,000.", createdAt: new Date("2026-01-10") },
      { userId: user.id, tradeId: trade1.id, action: "ADD_STOCK", details: "Added Apple (AAPL) and Tesla (TSLA) stocks.", createdAt: new Date("2026-01-12") },
      { userId: user.id, tradeId: trade1.id, action: "UPDATE_TRADE", details: "Closed Trade 1. Distributed $2,000 profit proportionally: Owner ($1,000), Usha ($600), Mom ($400).", createdAt: new Date("2026-04-01") },
      { userId: user.id, tradeId: trade2.id, action: "CREATE_TRADE", details: "Created Trade 2 (Active Tech Portfolio) and rolled over $2,000 of profits from Trade 1.", createdAt: new Date("2026-04-01") },
      { userId: user.id, tradeId: trade2.id, action: "TRANSACTION", details: "Added $8,000 fresh cash capital: Owner ($4,000), Usha ($2,400), Mom ($1,600).", createdAt: new Date("2026-04-02") },
      { userId: user.id, tradeId: trade2.id, action: "ADD_STOCK", details: "Bought Microsoft (MSFT) and Nvidia (NVDA) stock holdings.", createdAt: new Date("2026-04-03") },
    ],
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
