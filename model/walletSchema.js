const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'debit'], // Specify transaction types
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Ensure no negative transaction amounts
    },
    description: {
      type: String,
      required: true, // Description of the transaction (e.g., "Order #1234 Refund")
    },
    date: {
      type: Date,
      default: Date.now, // Timestamp of the transaction
    },
  },
  { _id: false } // Avoid creating an extra _id for each transaction
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0, // Default wallet balance
      min: 0, // Prevent negative wallet balance
    },
    transactionHistory: {
      type: [transactionSchema],
      default: [], // Start with an empty transaction history
    },
  },
  { timestamps: true } // Add createdAt and updatedAt timestamps
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
