const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {Account} = require("../db");
const {authMiddleware} = require("../middleware");

router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const account = await Account.findOne({ userId: req.userId });
        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }
        res.json({ balance: account.balance });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const {amount , to} = req.body;

    if (amount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: "Invalid transfer amount" });
    }

    try {
        const from = await Account.findOne({userId:req.userId}, session);
        if (!from) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Source account not found" });
        }

        if (from.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Insufficient funds" });
        }

        const toAccount = await Account.findOne({userId:to}, session);
        if (!toAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Destination account not found" });
        }

        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);
        await session.commitTransaction();
        session.endSession();
        res.json({ message: "Transfer successful" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Failed to transfer funds" });
    }
});


module.exports = router;