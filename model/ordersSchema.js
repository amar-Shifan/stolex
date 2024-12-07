const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        status: { type: String, default: 'Pending' }
      },
    ],
    totalAmount: { type: Number, required: true }, 
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true }, 
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    razorpayDetails: {
      orderId: { type: String }, // Razorpay order ID
      paymentId: { type: String }, // Razorpay payment ID (after successful payment)
      signature: { type: String }, // Razorpay signature (for verification)
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
