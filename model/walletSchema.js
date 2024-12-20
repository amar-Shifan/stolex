const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'debit'], 
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0, 
    },
    description: {
      type: String,
      required: true, 
    },
    date: {
      type: Date,
      default: Date.now, 
    },
  },
  { _id: false } 
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0, 
      min: 0, 
    },
    transactionHistory: {
      type: [transactionSchema],
      default: [], 
    },
  },
  { timestamps: true } 
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
