import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get user wallet
router.get("/wallet", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      balances: user.wallet.balances,
      transactions: user.wallet.transactions,
      is18PlusVerified: user.is18PlusVerified
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify 18+
router.post("/verify-18", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.is18PlusVerified = true;
    await user.save();
    res.status(200).json({ success: true, is18PlusVerified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulated crypto prices
const getPrices = () => ({
  BTC: 68000 + Math.random() * 2000,
  ETH: 3500 + Math.random() * 200,
  SOL: 140 + Math.random() * 20,
  XRP: 0.55 + Math.random() * 0.1,
  USDT: 1
});

// Get current crypto prices
router.get("/prices", (req, res) => {
  res.status(200).json(getPrices());
});

// Execute trade (buy/sell)
router.post("/trade", verifyToken, async (req, res) => {
  try {
    const { type, coin, amount } = req.body;
    const user = await User.findById(req.user.id);
    const prices = getPrices();
    const price = prices[coin];
    
    if (type === "buy") {
      const cost = amount * price;
      if (user.wallet.balances.USDT < cost) {
        return res.status(400).json({ error: "Insufficient USDT balance" });
      }
      user.wallet.balances.USDT -= cost;
      user.wallet.balances[coin] += amount;
    } else if (type === "sell") {
      if (user.wallet.balances[coin] < amount) {
        return res.status(400).json({ error: `Insufficient ${coin} balance` });
      }
      user.wallet.balances[coin] -= amount;
      user.wallet.balances.USDT += amount * price;
    }

    // Add transaction
    user.wallet.transactions.unshift({
      type: type === "buy" ? "trade_buy" : "trade_sell",
      coin,
      amount,
      price,
      timestamp: new Date(),
      status: "completed"
    });

    await user.save();
    res.status(200).json({ success: true, balances: user.wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deposit (simulated)
router.post("/deposit", verifyToken, async (req, res) => {
  try {
    const { coin, amount, paymentMethod } = req.body;
    const user = await User.findById(req.user.id);
    
    user.wallet.balances[coin] += amount;
    user.wallet.transactions.unshift({
      type: "deposit",
      coin,
      amount,
      timestamp: new Date(),
      status: "completed"
    });

    await user.save();
    res.status(200).json({ success: true, balances: user.wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw (simulated)
router.post("/withdraw", verifyToken, async (req, res) => {
  try {
    const { coin, amount, address } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user.wallet.balances[coin] < amount) {
      return res.status(400).json({ error: `Insufficient ${coin} balance` });
    }

    user.wallet.balances[coin] -= amount;
    user.wallet.transactions.unshift({
      type: "withdraw",
      coin,
      amount,
      timestamp: new Date(),
      status: "completed"
    });

    await user.save();
    res.status(200).json({ success: true, balances: user.wallet.balances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
