const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true, // Ensure coupon codes are stored in uppercase
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'], 
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minPurchaseAmount: {
    type: Number,
    default: 0, // Minimum purchase amount required to apply the coupon
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // Optional cap for percentage discounts
  },
  startDate: {
    type: Date,
    default: Date.now, // Coupons can start immediately if not specified
  },
  expiryDate: {
    type: Date,
    required: true, // Ensure coupons have an expiry date
  },
  usageLimit: {
    type: Number,
    default: null, // Limit on the number of times the coupon can be used
  },
  usedCount: {
    type: Number,
    default: 0, // Track how many times the coupon has been used
  },
  isActive: {
    type: Boolean,
    default: true, // Determine if the coupon is active
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
