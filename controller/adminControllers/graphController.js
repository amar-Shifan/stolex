// Graph Controller
const { name } = require('ejs');
const Order = require('../../model/ordersSchema');


const getChartData = async(req,res)=>{
    try {
        const { filter } = req.query;

        // Define date range based on filter
        const now = new Date();
        let startDate;
        if (filter === 'yearly') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (filter === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filter === 'weekly') {
            const startOfWeek = now.getDate() - now.getDay();
            startDate = new Date(now.setDate(startOfWeek));
        } else {
            return res.status(400).json({ message: 'Invalid filter' });
        }

        // Fetch sales data grouped by product
        const products = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', quantitySold: { $sum: '$items.quantity' } } },
            { $sort: { quantitySold: -1 } },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $project: { name: '$product.name', quantitySold: 1 } }
        ]);

        const categories = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', quantitySold: { $sum: '$items.quantity' } } },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' }, // Assuming each product has one category
            { $group: { _id: '$category.name', quantitySold: { $sum: '$quantitySold' } } },
            { $sort: { quantitySold: -1 } },
            { $project: { name: '$_id', quantitySold: 1, _id: 0 } }
        ]);
        
        const brands = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', quantitySold: { $sum: '$items.quantity' } } },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $group: { _id: '$product.brand', quantitySold: { $sum: '$quantitySold' } } },
            { $sort: { quantitySold: -1 } },
            { $project: { name: '$_id', quantitySold: 1 } }
        ])

        res.json({
            products,
            brands,
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {getChartData}