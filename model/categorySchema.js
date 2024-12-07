const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    parentCategory: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    level: {
        type: Number,
        default: 0 
    },
    slug: {
        type: String,
        unique: true
    },
    brands: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Brand'
        }
    ],
    isListed: {type : Boolean , default : true}
}, {
    timestamps: true
});

categorySchema.pre('save', async function (next) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    const existingSlug = await mongoose.model('Category').findOne({ slug: this.slug });
    if (existingSlug) {
        this.slug = `${this.slug}-${Date.now()}`;
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
