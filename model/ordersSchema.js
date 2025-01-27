const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId : {type: String , required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        discountApplied: { type: Number, default: 0 }, // Proportional discount applied to the item
        refundAmount: { type: Number, default: 0 }, // Refund amount if item is returned
        status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Returned', 'Cancelled' ,'return-request' ,'cancel-request'], default: 'Pending' },
        returnReason: { type: String, default: '' }, // Reason for item return
        cancelReason:{type:String , default: ''}
      },
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: Number, required: true },
      phoneNumber: { type: String, required: true }
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod' , 'wallet'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'return-request' ,'cancel-request'],
      default: 'pending',
    },
    razorpayDetails: {
      orderId: { type: String }, // Razorpay order ID
      paymentId: { type: String }, // Razorpay payment ID (after successful payment)
      signature: { type: String }, // Razorpay signature (for verification)
    },
    cancelReason: {type:String,default:''},
    returnReason: { type: String, default: '' }, // Reason for order-level return
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);



module.exports = mongoose.model('Order', orderSchema);
