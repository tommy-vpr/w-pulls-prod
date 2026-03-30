// scripts/reconcile-wallets.ts
//
// Run daily via cron: npx tsx scripts/reconcile-wallets.ts
// Compares total DB wallet balances against Stripe available balance
// and flags any discrepancies.

import "dotenv/config";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const ALERT_THRESHOLD_CENTS = 100; // $1.00 — alert if mismatch exceeds this

async function reconcile() {
  console.log("🔄 Starting wallet reconciliation...\n");

  // 1. Total DB wallet balances
  const dbAggregate = await prisma.userWallet.aggregate({
    _sum: { balance: true },
    _count: true,
  });

  const totalDbBalance = dbAggregate._sum.balance ?? 0;
  const walletCount = dbAggregate._count;

  // 2. Pending withdrawals (already debited from wallets, not yet transferred)
  const pendingWithdrawals = await prisma.withdrawal.aggregate({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
    _sum: { amount: true },
    _count: true,
  });

  const pendingAmount = pendingWithdrawals._sum.amount ?? 0;
  const pendingCount = pendingWithdrawals._count;

  // 3. Stripe balance
  const stripeBalance = await stripe.balance.retrieve();
  const availableUsd = stripeBalance.available
    .filter((b) => b.currency === "usd")
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingUsd = stripeBalance.pending
    .filter((b) => b.currency === "usd")
    .reduce((sum, b) => sum + b.amount, 0);

  // 4. Calculate expected Stripe balance
  // Stripe balance should >= DB balance + pending withdrawals
  // (Stripe also holds platform revenue that isn't in user wallets)
  const expectedMinimum = totalDbBalance + pendingAmount;
  const difference = availableUsd - expectedMinimum;

  // 5. Report
  console.log("📊 Reconciliation Report");
  console.log("========================\n");

  console.log("DB Wallets:");
  console.log(`  Active wallets:      ${walletCount}`);
  console.log(
    `  Total balance:       $${(totalDbBalance / 100).toFixed(2)}`,
  );
  console.log(
    `  Pending withdrawals: $${(pendingAmount / 100).toFixed(2)} (${pendingCount} pending)`,
  );
  console.log(
    `  Total owed to users: $${(expectedMinimum / 100).toFixed(2)}\n`,
  );

  console.log("Stripe Balance:");
  console.log(`  Available:           $${(availableUsd / 100).toFixed(2)}`);
  console.log(`  Pending:             $${(pendingUsd / 100).toFixed(2)}`);
  console.log(
    `  Total:               $${((availableUsd + pendingUsd) / 100).toFixed(2)}\n`,
  );

  console.log("Comparison:");
  console.log(
    `  Stripe available:    $${(availableUsd / 100).toFixed(2)}`,
  );
  console.log(
    `  Owed to users:       $${(expectedMinimum / 100).toFixed(2)}`,
  );
  console.log(
    `  Difference:          $${(difference / 100).toFixed(2)}`,
  );

  if (difference < 0) {
    console.log(
      "\n🔴 ALERT: Stripe balance is LESS than owed to users!",
    );
    console.log(
      `   Shortfall: $${(Math.abs(difference) / 100).toFixed(2)}`,
    );
  } else if (difference < ALERT_THRESHOLD_CENTS) {
    console.log("\n🟡 WARNING: Stripe balance is very close to owed amount.");
  } else {
    console.log(
      `\n✅ OK: Stripe has $${(difference / 100).toFixed(2)} surplus (platform revenue)`,
    );
  }

  // 6. Check for anomalies
  console.log("\n\n📋 Anomaly Checks");
  console.log("==================\n");

  // Negative balances
  const negativeWallets = await prisma.userWallet.findMany({
    where: { balance: { lt: 0 } },
    include: { user: { select: { email: true } } },
  });

  if (negativeWallets.length > 0) {
    console.log(`🔴 ${negativeWallets.length} wallet(s) with negative balance:`);
    for (const w of negativeWallets) {
      console.log(
        `   - ${w.user.email}: $${(w.balance / 100).toFixed(2)}`,
      );
    }
  } else {
    console.log("✅ No negative balances found.");
  }

  // Stuck withdrawals (pending > 1 hour)
  const stuckCutoff = new Date(Date.now() - 60 * 60 * 1000);
  const stuckWithdrawals = await prisma.withdrawal.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      createdAt: { lt: stuckCutoff },
    },
    include: { user: { select: { email: true } } },
  });

  if (stuckWithdrawals.length > 0) {
    console.log(
      `\n🟡 ${stuckWithdrawals.length} withdrawal(s) stuck > 1 hour:`,
    );
    for (const w of stuckWithdrawals) {
      console.log(
        `   - ${w.user.email}: $${(w.amount / 100).toFixed(2)} (${w.status} since ${w.createdAt.toISOString()})`,
      );
    }
  } else {
    console.log("✅ No stuck withdrawals.");
  }

  // Balance vs ledger mismatch (spot check 10 random wallets)
  const sampleWallets = await prisma.userWallet.findMany({
    where: { balance: { gt: 0 } },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });

  let ledgerMismatches = 0;
  for (const wallet of sampleWallets) {
    const lastTx = await prisma.walletTransaction.findFirst({
      where: { userId: wallet.userId },
      orderBy: { createdAt: "desc" },
    });

    if (lastTx && lastTx.balanceAfter !== wallet.balance) {
      ledgerMismatches++;
      console.log(
        `\n🔴 Ledger mismatch for userId ${wallet.userId}: wallet=${wallet.balance}, lastTx.balanceAfter=${lastTx.balanceAfter}`,
      );
    }
  }

  if (ledgerMismatches === 0) {
    console.log(
      `\n✅ Ledger spot check passed (${sampleWallets.length} wallets sampled).`,
    );
  }

  console.log("\n\n✅ Reconciliation complete.");
  await prisma.$disconnect();
}

reconcile().catch((err) => {
  console.error("❌ Reconciliation failed:", err);
  process.exit(1);
});
