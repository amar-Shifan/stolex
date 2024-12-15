const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  applyTo: {
    type: String,
    enum: ['products', 'categories'],
    required: true
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Offer', offerSchema);
