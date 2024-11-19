const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../middlewares/delete');
const mongoose = require('mongoose')
const fs = require('fs');

const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, brand, category, status } = req.body;

    // Validate if required fields are present
    if (!name || !description || !price || !category || !status) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Validate if exactly 3 images are uploaded
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ message: 'Exactly 3 images are required.' });
    }

    const imageUrls = req.files.map(file => file.path);

    // Create new product instance
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

    // Save the product to the database
    await newProduct.save();

    return res.status(200).json({ message: 'Product added successfully.' });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'An error occurred while adding the product.' });
  }
};



const getAddProduct  =  async (req, res) => {
    try {
        const categories = await Category.find({}); 
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
        // First, get the selected category and any child categories
        const selectedCategory = await Category.findById(categoryFilter);
        if (selectedCategory) {
            const childCategories = await Category.find({
                parentCategory: selectedCategory._id
            });
            
            // Include both the selected category and its children in the filter
            const categoryIds = [selectedCategory._id, ...childCategories.map(c => c._id)];
            filter.category = { $in: categoryIds };
        }
    }

    // Build sort object
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

    // Render the full page for non-AJAX requests
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
  
      // Parse stock data from the request body
      let stockData = [];
      if (req.body.stock) {
        try {
          stockData = JSON.parse(req.body.stock);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid stock data format' });
        }
      }
  
      // Handle images uploaded in the request
      let updatedImages = req.processedImages || [];
  
      // If there are new image uploads (from multer or another source)
      if (req.files && req.files.newImages) {
        const newImages = Array.isArray(req.files.newImages) ? req.files.newImages : [req.files.newImages];
  
        // Upload each new image to Cloudinary
        const uploadPromises = newImages.map((file) => uploadToCloudinary(file.path)); // Assuming you are passing the file path
        const uploadedImages = await Promise.all(uploadPromises);
  
        // Add uploaded image URLs to the updatedImages array
        updatedImages = [...updatedImages, ...uploadedImages.map((img) => img.url)];
  
        // Cleanup temporary image files after upload
        cleanupTempFiles(newImages);
      }
  
      // Update product details
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: stockData,
        brand: req.body.brand,
        category: req.body.category,
        status: req.body.status,
        images: updatedImages, // Updated images with Cloudinary URLs
      };
  
      // Perform the update in the database
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
  

module.exports = {addProduct , getAddProduct ,getProducts ,updateProduct , getUpdate } 