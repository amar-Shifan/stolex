//Offer Controller
const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const Offer = require('../../model/offerSchema')

// Render the Offer page 
const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({})
            .populate('categoryIds') 
            .populate('productIds');

        const categoryOffers = offers.filter(offer => offer.applyTo === 'categories');
        const productOffers = offers.filter(offer => offer.applyTo === 'products');

        res.render('admin/offer', { categoryOffers, productOffers });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.render('user/error',{message:'Something went wrong!'})
    }
};

// Create Offer Controller
const createOffer = async (req, res) => {
    try {
        const { type, title, discount, startDate, expiryDate, categoryId, productId } = req.body;

        if (!title || discount === undefined || !startDate || !expiryDate || !type) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (expiry <= start) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be later than the start date.',
            });
        }

        const offerData = {
            title,
            discount,
            startDate: start,
            expiryDate: expiry,
            applyTo: type,
        };

        if (type === 'products') {
            const ids = Array.isArray(productId) ? productId : [productId];
            if (!ids || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Product IDs must be provided for product offers.' });
            }
            offerData.productIds = ids;
        }
        else if (type === 'categories') {
            const ids = Array.isArray(categoryId) ? categoryId : [categoryId];
            if (!ids || ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Category IDs must be provided for category offers.' });
            }
            offerData.categoryIds = ids;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid offer type.' });
        }

        const offer = new Offer(offerData);
        await offer.save();

        if (type === 'products') {
            const products = await Product.find({ _id: { $in: productId } });
            for (const product of products) {
                const discountedPrice = product.price * (1 - discount / 100);
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            offer: offer._id,
                            discountedPrice: discountedPrice.toFixed(2), 
                        },
                    }
                );
            }
        } else if (type === 'categories') {
            await Category.updateMany(
                { _id: { $in: categoryId } },
                {
                    $set: {
                        offerId: offer._id,
                    },
                }
            );
        
            const productsInCategories = await Product.find({ category: { $in: categoryId } });
        
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

// Get Category Controller
const getCategory = async(req,res)=>{
    try {
        const categories = await Category.find({status : 'Active' , level: 1 });
        res.json(categories);
      } catch (error) {
        res.status(500).json({ success:false , message: 'Unable to load categories' });
    }
}

// Get Products Controller
const getProducts = async(req,res)=>{
    try {
        const products = await Product.find({status : 'Active'});
        res.json(products);
      } catch (error) {
        res.status(500).json({ message: 'Unable to load products' });
      }
}

// Delete Category Offer Controller
const deleteCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const offerToDelete = await Offer.findById(id);
        if (!offerToDelete) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const product = await Product.updateMany(
            { offer: id }, 
            { $unset: { offer: 1, discountedPrice: 1 } } 
        );

        const category = await Category.updateMany(
            { offerId: id }, 
            { $unset: { offerId: 1 } } 
        );

        if (!product || !category) {
            return res.status(400).json({ success: false, message: 'Category or product is not found!' });
        }

        await Offer.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Successfully deleted' });
    } catch (error) {
        console.error('Error deleting category offer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete Product Offer Controller
const deleteProductOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const offerToDelete = await Offer.findById(id);
        if (!offerToDelete) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        await Product.updateMany(
            { offer: id }, 
            { $unset: { offer: 1, discountedPrice: 1 } } 
        );

        await Category.updateMany(
            { offerId: id }, 
            { $unset: { offerId: 1 } } 
        );

        await Offer.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Successfully deleted' });
    } catch (error) {
        console.error('Error deleting product offer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {getOffers , getCategory , getProducts ,createOffer ,deleteCategoryOffer , deleteProductOffer}