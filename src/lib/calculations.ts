export interface StockData {
  id: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
}

export interface TransactionData {
  id: string;
  amount: number; // positive for deposit, negative for withdrawal
  type: string;   // DEPOSIT, WITHDRAWAL, ROLLOVER
  date: Date | string;
}

export interface InvestorData {
  id: string;
  name: string;
  transactions: TransactionData[];
}

export interface TradeData {
  id: string;
  name: string;
  status: string; // ACTIVE, CLOSED
  rolloverProfit: number;
  stocks: StockData[];
  investors: InvestorData[];
}

export interface StockSummary {
  id: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  cost: number;
  value: number;
  profit: number;
  roi: number;
}

export interface InvestorSummary {
  id: string;
  name: string;
  totalDeposits: number;
  totalWithdrawals: number;
  netInvestment: number;
  sharePercentage: number;
  profitShare: number;
  currentValue: number;
}

export interface TradeSummary {
  id: string;
  name: string;
  status: string;
  rolloverProfit: number;
  totalStockCost: number;
  totalStockValue: number;
  totalStockProfit: number;
  totalInvestment: number;
  cashBalance: number;
  totalPortfolioValue: number;
  totalProfit: number;
  roi: number;
  stocks: StockSummary[];
  investors: InvestorSummary[];
}

export function calculateTradeSummary(trade: TradeData): TradeSummary {
  // 1. Calculate stock level metrics
  const stocks: StockSummary[] = trade.stocks.map((stock) => {
    const cost = stock.quantity * stock.buyPrice;
    const value = stock.quantity * stock.currentPrice;
    const profit = value - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;
    
    return {
      id: stock.id,
      name: stock.name,
      quantity: stock.quantity,
      buyPrice: stock.buyPrice,
      currentPrice: stock.currentPrice,
      cost: roundToTwo(cost),
      value: roundToTwo(value),
      profit: roundToTwo(profit),
      roi: roundToTwo(roi),
    };
  });

  const totalStockCost = stocks.reduce((sum, s) => sum + s.cost, 0);
  const totalStockValue = stocks.reduce((sum, s) => sum + s.value, 0);
  const totalStockProfit = totalStockValue - totalStockCost;

  // 2. Calculate investor level metrics
  const investors: InvestorSummary[] = trade.investors.map((investor) => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    investor.transactions.forEach((t) => {
      if (t.amount > 0) {
        totalDeposits += t.amount;
      } else {
        totalWithdrawals += Math.abs(t.amount);
      }
    });

    const netInvestment = totalDeposits - totalWithdrawals;

    return {
      id: investor.id,
      name: investor.name,
      totalDeposits: roundToTwo(totalDeposits),
      totalWithdrawals: roundToTwo(totalWithdrawals),
      netInvestment: roundToTwo(netInvestment),
      sharePercentage: 0, // calculated below
      profitShare: 0,     // calculated below
      currentValue: 0,    // calculated below
    };
  });

  const totalInvestment = investors.reduce((sum, i) => sum + i.netInvestment, 0);
  const cashBalance = totalInvestment - totalStockCost;
  
  // Total profit is exactly the stock profit (unrealized profit)
  const totalProfit = totalStockProfit;
  const totalPortfolioValue = totalInvestment + totalProfit;
  const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  // 3. Proportional profit sharing
  investors.forEach((i) => {
    if (totalInvestment > 0 && i.netInvestment > 0) {
      i.sharePercentage = roundToTwo((i.netInvestment / totalInvestment) * 100);
      i.profitShare = roundToTwo((i.netInvestment / totalInvestment) * totalProfit);
      i.currentValue = roundToTwo(i.netInvestment + i.profitShare);
    } else {
      i.sharePercentage = 0;
      i.profitShare = 0;
      i.currentValue = roundToTwo(Math.max(0, i.netInvestment));
    }
  });

  return {
    id: trade.id,
    name: trade.name,
    status: trade.status,
    rolloverProfit: roundToTwo(trade.rolloverProfit),
    totalStockCost: roundToTwo(totalStockCost),
    totalStockValue: roundToTwo(totalStockValue),
    totalStockProfit: roundToTwo(totalStockProfit),
    totalInvestment: roundToTwo(totalInvestment),
    cashBalance: roundToTwo(cashBalance),
    totalPortfolioValue: roundToTwo(totalPortfolioValue),
    totalProfit: roundToTwo(totalProfit),
    roi: roundToTwo(roi),
    stocks,
    investors,
  };
}

export function calculateAggregatedStats(summaries: TradeSummary[]) {
  let totalInvestment = 0;
  let totalPortfolioValue = 0;
  let totalProfit = 0;
  let activeTradesCount = 0;
  let closedTradesCount = 0;

  summaries.forEach((s) => {
    if (s.status === "ACTIVE") {
      totalInvestment += s.totalInvestment;
      totalPortfolioValue += s.totalPortfolioValue;
      totalProfit += s.totalProfit;
      activeTradesCount++;
    } else {
      closedTradesCount++;
    }
  });

  const overallRoi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  // Investor breakdown across all active trades
  const investorBreakdown: { [name: string]: { investment: number; value: number; profit: number } } = {};

  summaries.forEach((s) => {
    if (s.status === "ACTIVE") {
      s.investors.forEach((i) => {
        if (!investorBreakdown[i.name]) {
          investorBreakdown[i.name] = { investment: 0, value: 0, profit: 0 };
        }
        investorBreakdown[i.name].investment += i.netInvestment;
        investorBreakdown[i.name].value += i.currentValue;
        investorBreakdown[i.name].profit += i.profitShare;
      });
    }
  });

  const formattedInvestors = Object.entries(investorBreakdown).map(([name, data]) => ({
    name,
    investment: roundToTwo(data.investment),
    value: roundToTwo(data.value),
    profit: roundToTwo(data.profit),
    roi: roundToTwo(data.investment > 0 ? (data.profit / data.investment) * 100 : 0),
  }));

  return {
    totalInvestment: roundToTwo(totalInvestment),
    totalPortfolioValue: roundToTwo(totalPortfolioValue),
    totalProfit: roundToTwo(totalProfit),
    roi: roundToTwo(overallRoi),
    activeTradesCount,
    closedTradesCount,
    investors: formattedInvestors,
  };
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
