const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../middlewares/delete');
const mongoose = require('mongoose')
const fs = require('fs');

const brandFetch = async(req,res)=>{
  try {
   
      try {
        const category = await Category.findById(req.params.id)
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
      } catch (err) {
        console.error(err);
      }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({success:false , message : 'something wetn wrong'})
  }
}

//ADD PRODUCT
const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, brand, category, status } = req.body;

    if (!name || !description || !price || !category || !status) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ message: 'Exactly 3 images are required.' });
    }

    const imageUrls = req.files.map(file => file.path);

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      brand,
      category,
      images: imageUrls,
      status: status || 'Active',
    });

    await newProduct.save();

    return res.status(200).json({ message: 'Product added successfully.' });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'An error occurred while adding the product.' });
  }
};



const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({}).populate('brands', 'name'); 
        res.render('admin/add-product', { categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('An error occurred while fetching categories.');
    }
};

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const categoryFilter = req.query.category || '';
    const sortOption = req.query.sort || '';

    // Build the filter object
    let filter = {};

    // Add search filter if search query exists
    if (searchQuery) {
        filter.$or = [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } },
        ];
    }

    // Add category filter if category is selected
    if (categoryFilter && mongoose.Types.ObjectId.isValid(categoryFilter)) {

        const selectedCategory = await Category.findById(categoryFilter);
        if (selectedCategory) {
            const childCategories = await Category.find({
                parentCategory: selectedCategory._id
            });
            
            const categoryIds = [selectedCategory._id, ...childCategories.map(c => c._id)];
            filter.category = { $in: categoryIds };
        }
    }

    let sort = {};
    switch (sortOption) {
        case 'latest':
            sort = { createdAt: -1 };
            break;
        case 'low-to-high':
            sort = { 'totalQuantity': 1 };
            break;
        case 'high-to-low':
            sort = { 'totalQuantity': -1 };
            break;
        default:
            sort = { createdAt: -1 };
    }

    // Aggregate pipeline for products
    const productsQuery = Product.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryData'
            }
        },
        { $unwind: '$categoryData' },
        {
            $addFields: {
                totalQuantity: {
                    $cond: {
                        if: { $isArray: "$stock" },
                        then: { $sum: "$stock.quantity" },
                        else: "$stock"
                    }
                }
            }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
    ]);

    const products = await productsQuery;
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch only level 1 categories for the filter dropdown
    const categories = await Category.find({ level: 1 }).sort({ name: 1 });

    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.json({
            products,
            currentPage: page,
            totalPages,
            categories,
        });
    }

    res.render('admin/products', {
        products,
        currentPage: page,
        totalPages,
        categories,
        selectedCategory: categoryFilter,
        selectedSort: sortOption
    });

} catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Error in fetching products' });
}

};

    const getUpdate = async (req,res)=>{
        
        try {

            const productId = req.params.id;

            const product = await Product.findById(productId);
            const categories = await Category.find({level:1})

            if(!product){
                return res.status(404).send("Product not found")
            }
            res.render('admin/update-product',{product,categories})

            
        } catch (error) {
            console.log("error in gettting ",error.message)
        } 
        
    }

  // Update product
  const updateProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
      let stockData = [];
      if (req.body.stock) {
        try {
          stockData = JSON.parse(req.body.stock);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid stock data format' });
        }
      }
  
      let updatedImages = req.processedImages || [];
  
      if (req.files && req.files.newImages) {
        const newImages = Array.isArray(req.files.newImages) ? req.files.newImages : [req.files.newImages];
  
        const uploadPromises = newImages.map((file) => uploadToCloudinary(file.path)); 
        const uploadedImages = await Promise.all(uploadPromises);
  
        updatedImages = [...updatedImages, ...uploadedImages.map((img) => img.url)];
  
        cleanupTempFiles(newImages);
      }
  
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: stockData,
        brand: req.body.brand,
        category: req.body.category,
        status: req.body.status,
        images: updatedImages, 
      };
  
      const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
        runValidators: true,
      });
  
      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Failed to update product' });
      }
  
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the product',
      });
    }
  };
  
  // Helper function to cleanup temporary files after upload
  const cleanupTempFiles = (files) => {
    if (!files) return;
  
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach((file) => {
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });
  };
  
  const getStocks = async (req, res) => {
    try {
      const { search } = req.query;
      let filter = {}; 
      
      if (search) {
        filter = {
          $or: [
            { "brand": { $regex: search, $options: 'i' } },
            { "category.name": { $regex: search, $options: 'i' } },
            { "name": { $regex: search, $options: 'i' } },
            { "description": { $regex: search, $options: 'i' } },
          ]
        }
      }
      
      const products = await Product.find(filter).populate('category', 'name'); 
      res.render('admin/stock-manage', { products });
    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Something went wrong!' });
    }
  };
  

  const addStock = async (req, res) => {
    try {
      const { productId, size, quantity } = req.body;
  
      // Validate the input
      if (!productId || !size || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input: Ensure all fields are provided and quantity is greater than 0.',
        });
      }
  
      // Find the product by ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.',
        });
      }
  
      // Check if the size exists in the stock array
      const stockEntryIndex = product.stock.findIndex((stock) => stock.size === size);
  
      if (stockEntryIndex === -1) {
        // If stock entry for the size doesn't exist, push a new stock entry
        await Product.updateOne(
          { _id: productId },
          {
            $push: {
              stock: { size, quantity },
            },
          }
        );
        return res.status(200).json({
          success: true,
          message: 'New stock entry added successfully.',
        });
      } else {
        // If stock entry exists, update the quantity
        await Product.updateOne(
          { _id: productId, 'stock.size': size },
          {
            $inc: { 'stock.$.quantity': quantity }, // Increment the quantity by the specified amount
          }
        );
        return res.status(200).json({
          success: true,
          message: 'Stock quantity updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  };
  
  
  
  
  
  
module.exports = {addProduct , getAddProduct ,getProducts ,updateProduct , getUpdate , getStocks ,addStock ,brandFetch} 