const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const Offer = require('../../model/offerSchema')

const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({})
            .populate('categoryIds') // Populate related fields
            .populate('productIds');

        const categoryOffers = offers.filter(offer => offer.applyTo === 'categories');
        const productOffers = offers.filter(offer => offer.applyTo === 'products');

        res.render('admin/offer', { categoryOffers, productOffers });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};





const createOffer = async (req, res) => {
    try {
        console.log(req.body);
        const { type, title, discount, startDate, expiryDate, categoryId, productId } = req.body;

        console.log(title, discount, startDate, expiryDate, type, categoryId, productId);

        // Validate required fields
        if (!title || discount === undefined || !startDate || !expiryDate || !type) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        // Validate date range
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (expiry <= start) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be later than the start date.',
            });
        }

        // Create the offer
        const offerData = {
            title,
            discount,
            startDate: start,
            expiryDate: expiry,
            applyTo: type,
        };
        console.log('working ')

        if (type === 'products') {
            const ids = Array.isArray(productId) ? productId : [productId];
            if (!ids || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Product IDs must be provided for product offers.' });
            }
            offerData.productIds = ids;
            console.log('working 2')
        }
        else if (type === 'categories') {
             console.log('working 2')
            const ids = Array.isArray(categoryId) ? categoryId : [categoryId];
            if (!ids || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Category IDs must be provided for category offers.' });
            }
            offerData.categoryIds = ids;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid offer type.' });
        }
        console.log('saving ')
        // Save offer to the database
        const offer = new Offer(offerData);
        await offer.save();

        // Update products or categories with the offer
        if (type === 'products') {
            const products = await Product.find({ _id: { $in: productId } });
            for (const product of products) {
                const discountedPrice = product.price * (1 - discount / 100);
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            offer: offer._id,
                            discountedPrice: discountedPrice.toFixed(2), // Save the calculated discounted price
                        },
                    }
                );
            }
        } else if (type === 'categories') {
            // Update the offer for the selected categories
            await Category.updateMany(
                { _id: { $in: categoryId } },
                {
                    $set: {
                        offerId: offer._id,
                    },
                }
            );
        
            // Fetch all products in the affected categories
            const productsInCategories = await Product.find({ category: { $in: categoryId } });
        
            // Apply the offer discount to the products in those categories
            const bulkOperations = productsInCategories.map(product => {
                const discountedPrice = Number((product.price * (1 - discount / 100)).toFixed(2));
                return {
                    updateOne: {
                        filter: { _id: product._id },
                        update: {
                            $set: {
                                offer: offer._id,
                                discountedPrice: discountedPrice,
                            },
                        },
                    },
                };
            });
        
            // Perform a bulkWrite operation for efficiency
            if (bulkOperations.length > 0) {
                await Product.bulkWrite(bulkOperations);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Offer created successfully!',
            offer,
        });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

  
const getCategory = async(req,res)=>{
    try {
        const categories = await Category.find({status : 'Active' , level: 1 });
        res.json(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success:false , message: 'Unable to load categories' });
    }
}

const getProducts = async(req,res)=>{
    try {
        const products = await Product.find({status : 'Active'});
        res.json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Unable to load products' });
      }
}

module.exports = {getOffers , getCategory , getProducts ,createOffer}