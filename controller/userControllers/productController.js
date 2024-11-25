const Product = require('../../model/productSchema')
const Category = require('../../model/categorySchema')
const getProductDetail = async (req, res) => {
    try {
      const productId = req.params.id;
  
      // Fetch the main product
      const product = await Product.findById(productId).populate('category');
      if (!product) {
        return res.status(404).send("Product not found");
      }
      
      // Fetch related products (by the same category, excluding the current product)
      const relatedProducts = await Product.find({
        category: product.category._id, 
        _id: { $ne: productId }, 
        status: 'Active', 
      })
        .limit(5); // Limit to 5 related products
  
      res.render('user/product-details', { product, relatedProducts });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  };
  
  
 

const getProducts =  async (req, res) => {
    try {
        // Get the query parameters
        const { category, brand } = req.query;
    
        if (!category && !brand) {
            return res.status(400).send('Category or Brand is required');
        }
    
        let products = [];
        let selectedName = '';
    
        if (category) {
            // Fetch category details
            const categoryData = await Category.findOne({ name: category });
            if (!categoryData) {
                return res.status(404).send('Category not found');
            }
    
            // Fetch products in the given category
            products = await Product.find({ category: categoryData._id }).populate('brand');
            selectedName = categoryData.name; // For displaying the category name
        } else if (brand) {
            // Fetch products of the given brand
            products = await Product.find({ brand }).populate('category');
            selectedName = brand; // For displaying the brand name
        }
    
        // Render the product list view
        res.render('user/topwear', {
            products,         // Directly pass the products array
            selectedName,     // Pass the selected category/brand name for the UI
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }    
    
}

module.exports = {getProductDetail , getProducts}