const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true }, 
    stock: [
        {
            size: { type: String, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    brand: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
},{
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);

