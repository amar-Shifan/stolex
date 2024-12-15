const Product = require('../../model/productSchema')
const Category = require('../../model/categorySchema')
const Brand = require('../../model/brandSchema');

const getProductDetail = async (req, res) => {
    try {
      const productId = req.params.id;
  
      const product = await Product.findById(productId).populate('category');
      if (!product) {
        return res.status(404).send("Product not found");
      }
      
      const relatedProducts = await Product.find({
        category: product.category._id, 
        _id: { $ne: productId }, 
        status: 'Active', 
      })
        .limit(5); 
      
      res.render('user/product-details', { product, relatedProducts });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  };

  const getProducts = async (req, res) => {
    try {
    const { category, brand, parentCategoryName, size, subCategory, search, sort } = req.query;
  
      let products = [];
      let selectedName = '';
      let sizes = [];
      let styles = [];
      let filters = {};
  
      if (brand) filters.brand = Array.isArray(brand) ? { $in: brand } : brand;
      if (size) filters["stock.size"] = Array.isArray(size) ? { $in: size } : size;
  
      if (subCategory) {
          const styleCategories = await Category.find({
              name: { $in: Array.isArray(subCategory) ? subCategory : [subCategory] },
          });
          const styleCategoryIds = styleCategories.map((cat) => cat._id);
          filters.category = { $in: styleCategoryIds };
      }
  
      if (search) {
          filters.$or = [
              { brand: { $regex: search, $options: 'i' } },
              { "category.name": { $regex: search, $options: 'i' } },
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
          ];
      }
  
      if (parentCategoryName) {
          if (parentCategoryName === 'all') {
              products = await Product.find({ ...filters, status: 'Active' }).populate('category').populate('offer');
          } else {
              products = await Product.find({ ...filters, status: 'Active' })
                  .populate({
                      path: 'category',
                      match: { parentCategory: parentCategoryName },
                  })
                  .exec();
              products = products.filter((product) => product.category);
          }
          selectedName = parentCategoryName;
      } else if (category) {
          const categoryData = await Category.findOne({ name: category });
          if (!categoryData) return res.status(404).send('Category not found');
  
          products = await Product.find({ ...filters, category: categoryData._id, status: 'Active' })
              .populate('category')
              .populate('offer')
              .exec();
          selectedName = categoryData.name;
      } else {
          products = await Product.find({ ...filters, status: 'Active' }).populate('category').populate('offer').exec();
          selectedName = 'All Products';
      }
  
      if (sort) {
          const sortOptions = {
              price_asc: { price: 1 },
              price_desc: { price: -1 },
              rating_desc: { averageRating: -1 },
              name_asc: { name: 1 },
              name_desc: { name: -1 },
              new_arrivals: { createdAt: -1 },
          };
          const sortQuery = sortOptions[sort] || {};
          products = await Product.find({ ...filters, status: 'Active' }).populate('category' ).populate('offer').sort(sortQuery).exec();
      }
  
      sizes = [...new Set(products.flatMap((product) => product.stock.map((stockItem) => stockItem.size)))];
      styles = await Category.find({
          level: 1,
          ...(parentCategoryName !== 'all' && { parentCategory: parentCategoryName || category || null }),
      });
  
      const brands = await Brand.find();
      
      console.log(products.length , 'product length ');
      
      console.log('console.log', products,
        selectedName,
        brands,
        sizes,
        styles,
        selectedFilters ={
            brand: Array.isArray(brand) ? brand : brand ? [brand] : [],
            size: Array.isArray(size) ? size : size ? [size] : [],
            style: Array.isArray(subCategory) ? subCategory : subCategory ? [subCategory] : [],
        },
        sort,)
        
      res.render('user/topwear', {
          products,
          selectedName,
          brands,
          sizes,
          styles,
          selectedFilters: {
              brand: Array.isArray(brand) ? brand : brand ? [brand] : [],
              size: Array.isArray(size) ? size : size ? [size] : [],
              style: Array.isArray(subCategory) ? subCategory : subCategory ? [subCategory] : [],
          },
          sort,
      });
  } catch (error) {
      console.error('Error fetching products:', error.message, error.stack);
      res.status(500).send('Server Error');
  }
  }


  const getShop = async (req, res) => {
    try {
        const { brand, size, category, search, sort, page = 1, limit = 12 } = req.query;

        // Pagination
        const skip = (page - 1) * limit;

        // Building the Query
        const filter = {};

        // Filtering by Brand
        if (brand) filter.brand = { $in: Array.isArray(brand) ? brand : [brand] };

        // Filtering by Size
        if (size) {
            filter["stock.size"] = { $in: Array.isArray(size) ? size : [size] };
        }

        // Filtering by Category
        if (category) filter.category = category;

        // Searching by Product Name or Description
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // Sorting
        let sortOption = {};
        switch (sort) {
            case "price_asc":
                sortOption.price = 1;
                break;
            case "price_desc":
                sortOption.price = -1;
                break;
            case "rating_desc":
                sortOption.rating = -1;
                break;
            case "new_arrivals":
                sortOption.createdAt = -1;
                break;
            case "name_asc":
                sortOption.name = 1;
                break;
            case "name_desc":
                sortOption.name = -1;
                break;
            default:
                sortOption = {}; // No sorting by default
        }

        // Fetch filtered and sorted products
        const totalProducts = await Product.countDocuments(filter); // Total products matching the filters
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // Fetch additional data
        const styles = await Category.find({ status: "Active", level: 1 });
        const brands = await Brand.find({});
        const sizes = await Product.distinct("stock.size"); // Get unique sizes

        const selectedName = req.query.category || "All Products";

        // Render the page
        res.render("user/footwear", {
            products,
            brands,
            sizes,
            styles,
            selectedName,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / limit),
            locals: {
                searchQuery: search || "",
                sort: sort || "",
            },
        });
    } catch (error) {
        console.error(error);
        res.render("error", { message: "Something went wrong!" });
    }
};



module.exports = {getProductDetail , getProducts ,getShop}